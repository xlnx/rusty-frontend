import { BuildingManager, BuildingPrototype } from "./manager";
import { Component, EventController } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { TerrainComponent } from "../terrain";
import { world2plain, DistUnit, plain2world } from "../../legacy";
import { EntityBuilder } from "aframe-typescript-toolkit";
import { BasemapComponent } from "../basemap";
import { WebSocketComponent } from "../../control";
import { Object3D } from "three";
import { Selectable } from "../selectable";
import { MessageData } from "../../web";

export class BuildingManagerComponent extends Component<{}> {

	public readonly manager!: BuildingManager

	public readonly finish = true
	public readonly ratio = 0

	constructor() { super("building-manager", {}) }

	init() {
		; (<any>this).manager = new BuildingManager()
	}

	load(...path: string[]) {
		; (<any>this).finish = false
		this.manager.load(path)
			.then(() => { ; (<any>this).finish = true })
	}

	tick() {
		if (!this.finish) {
			; (<any>this).ratio = this.manager.finishedRequests / this.manager.requests
			window["__fuck_manager"] = { manager: this.manager }
		} else {
			; (<any>this).ratio = 1
		}
	}
}

new BuildingManagerComponent().register()

interface BuildingIndicatorComponentSchema {
	readonly name: string
}

interface BuildingComponentSchema {
	readonly name: string
}

export class BuildingIndicatorComponent extends Component<BuildingIndicatorComponentSchema> {

	constructor() {
		super("building-indicator", {
			name: {
				type: "string",
				default: "[unknown]"
			}
		})
	}

	public static readonly validColor = new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(2)
	public static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2).multiplyScalar(2)

	public readonly proto: BuildingPrototype
	public modelInfo: any

	private readonly handlers: EventController[] = []

	init() {

		const manager: BuildingManagerComponent = window["building-manager"]
			; (<any>this).proto = manager.manager.get(this.data.name)

		if (this.proto) {

			const mat =
				new THREE.MeshPhongMaterial({
					side: THREE.DoubleSide,
					color: BuildingIndicatorComponent.invalidColor,
					opacity: 0.6,
					transparent: true,
				})
			// new THREE.MeshBasicMaterial({ color: 0xff0000 })
			const ind = this.proto.object.model.clone()
			ind.traverse(e => {
				const f = <THREE.Mesh>e
				if (f.isMesh) {
					f.material = mat
				}
			})

			this.el.setObject3D("mesh", ind)
			this.el.classList.add("indicator")

			this.handlers.push(this.listen("validate-building", (evt: any) => {
				mat.color.set(evt.detail ? BuildingIndicatorComponent.validColor
					: BuildingIndicatorComponent.invalidColor)
			}))

			this.handlers.push(this.listen("switch-proto", (evt: any) => {
				let dx = evt.detail

				//

				const socket = window["socket"]
				socket.socket.send(new MessageData(dx).toString())
			}))

			this.handlers.push(this.listen("locate-building", (msg: any) => {

				let modelInfo = msg.detail

				for (const handler of this.handlers) {
					handler.cancel()
				}

				const city: AFrame.Entity = window["city-editor"]

				const b = EntityBuilder.create("a-entity", {
					building: { name: this.data.name },
					// position: this.el.object3D.position,
					// rotation: this.el.object3D.rotation,
					scale: this.el.object3D.scale
				})
					.attachTo(city)
					.toEntity()

				console.log("locate a building")
				const socket: WebSocketComponent = window['socket']
				socket.el.emit("Add data", {
					state: "insert",
					roads: [],
					buildings: [{
						center: modelInfo.center,
						prototype: this.proto.name
					}]
				})

					; (<any>b).___my_private_fucking_data = modelInfo

			}))

		} else {

			console.error(`invalid building type: ${this.data.name}`)

		}
	}

}

new BuildingIndicatorComponent().register()

export class BuildingComponent extends Component<BuildingComponentSchema> {

	constructor() {
		super("building", {
			name: {
				type: "string",
				default: "[unknown]"
			}
		})
	}
	public readonly object: Object3D
	public readonly proto: BuildingPrototype
	public readonly building: BasemapBuildingItem<BuildingComponent>

	init() {

		this.el.setAttribute("ray-castable", {})
		const manager: BuildingManagerComponent = window["building-manager"]
			; (<any>this).proto = manager.manager.get(this.data.name)

		let modelInfo = (<any>this.el).___my_private_fucking_data

		if (!modelInfo) {
			modelInfo = window["__fuck_data"]
		}
		window["__fuck_data"] = undefined
		
		console.log("Incoming modelInfo: ", modelInfo)

		const basemap: BasemapComponent = window["basemap"]

		// console.log(modelInfo)
		const item = new BasemapBuildingItem<BuildingComponent>(this.proto, modelInfo.center,
			modelInfo.angle, modelInfo.road, modelInfo.offset)
		item.userData = this
			; (<any>this).building = item

		const { x, y, z } = plain2world(modelInfo.center)
		this.el.object3D.position.set(x, y, z)
		this.el.object3D.rotation.y = modelInfo.angle

		basemap.basemap.addBuilding(item)

		if (this.proto) {
			; (<any>this.object) = this.proto.object.model.clone(true)
			this.el.setObject3D("mesh", this.object)

			const terrain: TerrainComponent = window['terrain']
			terrain.terrain.mark(world2plain(this.el.object3D.position),
				modelInfo.angle, this.proto.placeholder)
			const height = 0
			// modelInfo.road.getMaxHeight(modelInfo.offset)
			terrain.terrain.placeBuilding(world2plain(modelInfo.center),
				modelInfo.angle, this.proto.placeholder, height)

			this.el.object3D.position.y += height * DistUnit


			// restore material
			this.object.traverse((node) => {
				const ele = <THREE.Mesh>node
				if (ele.isMesh) {
					this.originMaterial = (<any>ele.material)
				}
			})
		} else {
			console.error(`invalid building type: ${this.data.name}`)
		}
	}
	originMaterial: THREE.Material
	selectMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(2),
		side: THREE.DoubleSide,
		opacity: 0.5,
		transparent: true
	})
	hover() {
		this.object.traverse((node) => {
			// console.log(node)
			const ele = <THREE.Mesh>node
			if (ele.isMesh) {
				; (<any>ele.material) = this.selectMaterial
			}
		})
	}
	select() {
		this.el.object3D.add(this.proto.object.frame)
	}
	unhover() {
		this.object.traverse((node) => {
			// console.log(node)
			const ele = <THREE.Mesh>node
			if (ele.isMesh) {
				; (<any>ele.material) = this.originMaterial
			}
		})
	}
	unselect() {
		this.el.object3D.remove(this.proto.object.frame)
		this.object.traverse((node) => {
			// console.log(node)
			const ele = <THREE.Mesh>node
			if (ele.isMesh) {
				; (<any>ele.material) = this.originMaterial
			}
		})
	}
}

new BuildingComponent().register()

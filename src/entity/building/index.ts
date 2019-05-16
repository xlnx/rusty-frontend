import { BuildingManager, BuildingPrototype } from "./manager";
import { Component, EventController } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { TerrainComponent } from "../terrain";
import { world2plain, DistUnit } from "../../legacy";
import { EntityBuilder } from "aframe-typescript-toolkit";
import { BasemapComponent } from "../basemap";
import { WebSocketComponent } from "../../control";

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

	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(2)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2).multiplyScalar(2)

	public readonly proto: BuildingPrototype
	public modelInfo: any

	private readonly handlers: EventController[] = []

	init() {

		const manager: BuildingManagerComponent = window["building-manager"]
			; (<any>this).located = false
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

			this.handlers.push(this.listen("locate-building", (msg: any) => {

				let modelInfo = msg.detail

				this.el.setObject3D("mesh", this.proto.object.model.clone())
					; (<any>this).located = true
				this.el.classList.remove("indicator")

				for (const handler of this.handlers) {
					handler.cancel()
				}

				const city: AFrame.Entity = window["city-editor"]

				const b = EntityBuilder.create("a-entity", {
					building: { name: this.data.name },
					position: this.el.components.position,
					rotation: this.el.components.rotation,
					scale: this.el.components.scale
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

	public readonly proto: BuildingPrototype

	init() {

		const manager: BuildingManagerComponent = window["building-manager"]
			; (<any>this).located = false
			; (<any>this).proto = manager.manager.get(this.data.name)

		let modelInfo = (<any>this.el).___my_private_fucking_data

		const basemap: BasemapComponent = window["basemap"]

		// console.log(modelInfo)
		const item = new BasemapBuildingItem(this.proto, modelInfo.center,
			modelInfo.angle, modelInfo.road, modelInfo.offset)

		basemap.basemap.addBuilding(<any>item)

		if (this.proto) {

			this.el.setObject3D("mesh", this.proto.object.model.clone())

			const terrain: TerrainComponent = window['terrain']
			terrain.terrain.mark(world2plain(this.el.object3D.position),
				modelInfo.angle, this.proto.placeholder)
			const height = 0
			// modelInfo.road.getMaxHeight(modelInfo.offset)
			terrain.terrain.placeBuilding(world2plain(this.el.object3D.position),
				modelInfo.angle, this.proto.placeholder, height)

			this.el.object3D.position.y += height * DistUnit

		} else {

			console.error(`invalid building type: ${this.data.name}`)

		}
	}
}

new BuildingComponent().register()

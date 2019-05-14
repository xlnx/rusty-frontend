import { BuildingManager, BuildingPrototype } from "./manager";
import { Component, EventController } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { TerrainComponent } from "../terrain";
import { world2plain, DistUnit } from "../../legacy";
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

interface BuildingComponentSchema {
	readonly name: string
}

export class BuildingComponent extends Component<BuildingComponentSchema> {

	constructor() {
		super("building", {
			name: {
				type: "string",
				default: "[unknown]"
			}
		})
	}

	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(2)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2).multiplyScalar(2)

	public readonly proto: BuildingPrototype
	public readonly located!: boolean
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
					color: BuildingComponent.invalidColor,
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
				mat.color.set(evt.detail ? BuildingComponent.validColor
					: BuildingComponent.invalidColor)
			}))

			this.handlers.push(this.listen("locate-building", () => this.locateBuilding()))

		} else {

			console.error(`invalid building type: ${this.data.name}`)

		}
	}

	locateBuilding() {
		const modelInfo = this.modelInfo
		if (modelInfo && modelInfo.valid) {

			this.el.setObject3D("mesh", this.proto.object.model.clone())
				; (<any>this).located = true
			this.el.classList.remove("indicator")

			for (const handler of this.handlers) {
				handler.cancel()
			}
			// console.log(modelInfo)
			const item = new BasemapBuildingItem<BuildingComponent>(this.proto, modelInfo.center, modelInfo.angle, modelInfo.road, modelInfo.offset)
			item.userData = this

			window['basemap'].basemap.addBuilding(item)

			// send data to server
			const socket: WebSocketComponent = window['socket']
			socket.el.emit("Add data", {
				state: "insert",
				roads: [],
				buildings: [{
					center: item.center,
					prototype: item.proto.name
				}]
			})

			let terrain: TerrainComponent = window['terrain']
			terrain.terrain.mark(world2plain(this.el.object3D.position), modelInfo.angle, this.proto.placeholder)
			const height = terrain.terrain.placeBuilding(world2plain(this.el.object3D.position),
				modelInfo.angle, this.proto.placeholder, item.rect)

			this.el.object3D.position.y += height * DistUnit
		}
	}
}

new BuildingComponent().register()

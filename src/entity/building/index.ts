import { BuildingManager, BuildingPrototype } from "./manager";
import { Component, EventController } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { TerrainComponent } from "../terrain";
import { world2plain } from "../../legacy";

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
	public para: any

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

			const handlers: EventController[] = []

			handlers.push(this.listen("validate-building", (evt: any) => {
				mat.color.set(evt.detail ? BuildingComponent.validColor
					: BuildingComponent.invalidColor)
			}))

			handlers.push(this.listen("locate-building", () => {
				this.el.setObject3D("mesh", this.proto.object.model.clone())
					; (<any>this).located = true
				this.el.classList.remove("indicator")

				for (const handler of handlers) {
					handler.cancel()
				}

				const para = this.para
				if (para && para.valid) {
					// console.log(para)
					const item = new BasemapBuildingItem(this.proto.placeholder, para.angle, para.road, para.offset)
					window['basemap'].basemap.addBuilding(item)
				}

				let terrain: TerrainComponent = window['terrain']
				terrain.terrain.mark(world2plain(this.el.object3D.position), para.angle, this.proto.placeholder)
			}))

		} else {

			console.error(`invalid building type: ${this.data.name}`)

		}
	}
}

new BuildingComponent().register()

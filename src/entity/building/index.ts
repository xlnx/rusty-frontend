import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";
import { BuildingManager, BuildingPrototype } from "./manager";

export class BuildingManagerComponent extends ComponentWrapper<{}> {

	public readonly manager = new BuildingManager()

	public readonly finish = true
	public readonly ratio = 0

	constructor() { super("building-manager", {}) }

	load(...path: string[]) {
		; (<any>this).finish = false
		this.manager.load(path)
			.then(() => { ; (<any>this).finish = true })
	}

	tick() {
		; (<any>this).ratio = this.manager.finishedRequests / this.manager.requests
	}
}

new BuildingManagerComponent().register()

interface BuildingComponentSchema {
	readonly name: string
}

export class BuildingComponent extends ComponentWrapper<BuildingComponentSchema> {

	constructor() {
		super("building", {
			name: {
				type: "string",
				default: "[unknown]"
			}
		})
	}

	public readonly proto: BuildingPrototype
	public readonly located!: boolean

	init() {

		const manager: BuildingManagerComponent = window["building-manager"]
			; (<any>this).located = false
			; (<any>this).proto = manager.manager.get(this.data.name)

		if (this.proto) {

			const mat =
				new THREE.MeshPhongMaterial({
					color: new THREE.Color(1, 0, 0),
					opacity: 0.4,
					transparent: true,
					polygonOffset: true,
					polygonOffsetFactor: -1e4
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

			const handlers = {
				"locate-building": () => {
					this.el.setObject3D("mesh", this.proto.object.model.clone())
						; (<any>this).located = true
					for (const name in handlers) {
						this.el.removeEventListener(name, handlers[name])
					}
				}
			}
			for (const name in handlers) {
				this.el.addEventListener(name, handlers[name])
			}

		} else {

			console.error(`invalid building type: ${this.data.name}`)

		}
	}
}

new BuildingComponent().register()

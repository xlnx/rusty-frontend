import { ComponentWrapper } from "aframe-typescript-toolkit";
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

	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(4)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2).multiplyScalar(4)

	public readonly proto: BuildingPrototype
	public readonly located!: boolean

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

			const handlers = {
				"validate-building": (evt: any) => {
					mat.color.set(evt.detail ? BuildingComponent.validColor
						: BuildingComponent.invalidColor)
				},
				"locate-building": () => {
					this.el.setObject3D("mesh", this.proto.object.model.clone())
						; (<any>this).located = true
					this.el.classList.remove("indicator")
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

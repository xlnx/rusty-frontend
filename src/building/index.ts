import { ComponentWrapper } from "aframe-typescript-toolkit";
import { BuildingManager } from "./manager";

interface BuildingManagerComponentSchema {
	readonly finish: boolean
	readonly ratio: number
}

export class BuildingManagerComponent extends ComponentWrapper<BuildingManagerComponentSchema> {

	public readonly manager = new BuildingManager()

	constructor() {

		super("building-manager", {
			ratio: {
				type: "number",
				default: 0
			},
			finish: {
				type: "boolean",
				default: true
			}
		})
	}

	init() {

		this.el.addEventListener("load", (evt: any) => {

			this.el.setAttribute("building-manager", { finish: false })
			this.manager.load(evt.detail)
				.then(() => {
					this.el.setAttribute("building-manager", { finish: true })
				})
		})
	}

	tick() {
		this.el.setAttribute("building-manager", {
			ratio: this.manager.finishedRequests / this.manager.requests
		})
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

	init() {

		const manager = <AFrame.Entity>this.el.sceneEl.querySelector("[building-manager]")

		const proto = (<BuildingManagerComponent>manager.components["building-manager"])
			.manager.get(this.data.name)
		if (proto) {
			const model = proto.object.model.clone()
			model.scale.multiplyScalar(0.1)
			this.el.setObject3D("mesh", new AFRAME.THREE.Object3D().add(model))
		} else {
			console.error(`invalid building type: ${this.data.name}`)
		}
	}

	tick() {

	}
}

new BuildingComponent().register()

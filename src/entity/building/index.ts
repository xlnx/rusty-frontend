import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";
import { BuildingManager } from "./manager";

export class BuildingManagerComponent extends ComponentWrapper<{}> {

	public readonly manager = new BuildingManager()

	public finish = true
	public ratio = 0

	constructor() { super("building-manager", {}) }

	load(...path: string[]) {
		this.finish = false
		this.manager.load(path)
			.then(() => { this.finish = true })
	}

	tick() {
		this.ratio = this.manager.finishedRequests / this.manager.requests
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

		const manager: BuildingManagerComponent = window["building-manager"]

		const proto = manager.manager.get(this.data.name)
		if (proto) {
			const model = proto.object.model.clone()
			model.scale.multiplyScalar(0.1)

			this.el.setObject3D("mesh", model)
		} else {
			console.error(`invalid building type: ${this.data.name}`)
		}
	}

	tick() {

	}
}

new BuildingComponent().register()

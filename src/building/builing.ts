import { ComponentWrapper } from "aframe-typescript-toolkit";
import { BuildingManagerComponent } from "./manager";

interface BuildingComponentSchema {
	readonly name: string,
	readonly manager: BuildingManagerComponent
}

export class BuildingComponent extends ComponentWrapper<BuildingComponentSchema> {

	constructor() {
		super("building", {
			name: {
				type: "string",
				default: "[unknown]"
			},
			manager: {
				type: "selector"
			}
		})
	}

	init() {
		// this.el
		// mgr.load(
		// 	"export/Building_Bar"
		// ).then(() => {

		// while ()
		const proto = this.data.manager.get(this.data.name)
		if (proto) {
			const model = proto.object.model.clone()
			model.scale.multiplyScalar(0.1)
			this.el.setObject3D("mesh", new AFRAME.THREE.Object3D().add(model))
		} else {
			console.error(`invalid building type: ${this.data.name}`)
		}
		// })
	}

	tick() {

	}
}

new BuildingComponent().register()

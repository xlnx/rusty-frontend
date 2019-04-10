import { ComponentWrapper } from "aframe-typescript-toolkit";
import { TerrainComponent } from "../entity";

interface PreviewStateSchema {

}

export class PreviewState extends ComponentWrapper<PreviewStateSchema> {

	constructor() { super("preview-state", {}) }

	tick() {

		// const raycaster = <any>this.el.components.raycaster

		// if (raycaster.intersectedEls.length) {

		// 	const terrain: TerrainComponent = window["terrain"]
		// 	const { x, y } = terrain.terrain.coordCast(raycaster.intersections[0])

		// 	// console.log(x, y)
		// }

		// console.log("what")
	}
}

new PreviewState().register()

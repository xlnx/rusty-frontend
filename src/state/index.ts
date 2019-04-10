import { ComponentWrapper } from "aframe-typescript-toolkit";

interface PreviewStateSchema {

}

export class PreviewState extends ComponentWrapper<PreviewStateSchema> {

	constructor() {

		super("s-preview", {

		})
	}

	tick() {

		const raycaster = <any>(<any>this.el.components.raycaster)

		if (raycaster.intersectedEls.length) {
			console.log(raycaster.intersections[0])
		}

		// console.log("what")
	}
}

new PreviewState().register()

import { ComponentWrapper } from "aframe-typescript-toolkit";

interface PreviewStateSchema {

}

export class PreviewState extends ComponentWrapper<PreviewStateSchema> {

	constructor() {

		super("s-preview", {

		})
	}

	tick() {

		console.log("what")
	}
}

new PreviewState().register()

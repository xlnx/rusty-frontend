declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";

interface ButtonComponentSchema {
	readonly text: string
}

export class ButtonComponent extends ComponentWrapper<ButtonComponentSchema> {

	constructor() {
		super("button", {
			text: {
				type: "string",
				default: "btn"
			}
		})
	}

	init() {
		const entityText = this.el.getAttribute("text")
		EntityBuilder.create("a-text", {
			value: entityText || this.data.text,
			color: "black",
			position: "0 0 0"
		}).attachTo(this.el)
		EntityBuilder.create("a-entity", {
			geometry: { primitive: "box" },
			position: "0 0 -1e-8",
			scale: "4 1 1e-9"
		}).attachTo(this.el)
	}
}

new ButtonComponent().register()

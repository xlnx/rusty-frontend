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
		this.el.setAttribute("billboard", undefined)
		const entityText = this.el.getAttribute("text")
		EntityBuilder.create("a-text", {
			value: entityText || this.data.text,
			color: "black",
			position: "0 0 0"
		}).attachTo(this.el)
	}
}

new ButtonComponent().register()

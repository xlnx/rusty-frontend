declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";

interface ButtonComponentSchema {
	readonly text: string
}

export class ButtonComponent extends ComponentWrapper<ButtonComponentSchema> {

	private textEntity: EntityBuilder
	private buttonEntity: EntityBuilder
	private backEntity: EntityBuilder

	constructor(
		public position: string,
		public text: string,
		public width: number = -1,
		public height: number = -1
	) {
		super("button", {
			text: {
				type: "string",
				default: "btn"
			}
		})

		this.buttonEntity = EntityBuilder.create("button", {

		}).attachTo(this.el)

		this.textEntity = EntityBuilder.create("a-text", {
			value: this.text,
			color: "black",
			position: "0 0 0"
		}).attachTo(this.buttonEntity)
		this.backEntity = EntityBuilder.create("a-entity", {
			geometry: { primitive: "box" },
			position: "0 0 -1e-8",
			scale: "4 1 1e-9"
		}).attachTo(this.buttonEntity)

	}

	init() {
		const entityText = this.el.getAttribute("text")
	}
}

new ButtonComponent("0 0 0", "hello").register()

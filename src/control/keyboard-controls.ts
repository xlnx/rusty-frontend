import { ComponentWrapper } from "aframe-typescript-toolkit";

export class KeyboardControlsComponent extends ComponentWrapper<{ enable: boolean }>{

	constructor() {
		super("keyboard-controls", { enable: { type: "boolean", default: true } })
	}

	init() {

		document.addEventListener("keydown", evt => {
			if (this.data.enable) this.el.emit("-keydown", evt)
		})
		document.addEventListener("keyup", evt => {
			if (this.data.enable) this.el.emit("-keyup", evt)
		})
		document.addEventListener("keypress", evt => {
			if (this.data.enable) this.el.emit("-keypress", evt)
		})
	}
}

new KeyboardControlsComponent().register()

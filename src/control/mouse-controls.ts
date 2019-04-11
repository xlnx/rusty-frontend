import { ComponentWrapper } from "aframe-typescript-toolkit";



export class MouseControlsComponent extends ComponentWrapper<{ enable: boolean }> {

	constructor() {
		super("mouse-controls", { enable: { type: "boolean", default: true } })
	}

	init() {

		document.addEventListener("click", evt => {
			if (this.data.enable) this.el.emit("-click")
		})
		document.addEventListener("mousedown", evt => {
			if (this.data.enable) this.el.emit("-mousedown", evt)
		})
		document.addEventListener("mouseup", evt => {
			if (this.data.enable) this.el.emit("-mouseup", evt)
		})
	}
}

new MouseControlsComponent().register()

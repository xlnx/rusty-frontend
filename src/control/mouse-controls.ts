import { ComponentWrapper } from "aframe-typescript-toolkit";
import * as MobileDetect from "mobile-detect"

export class MouseControlsComponent extends ComponentWrapper<{ enable: boolean }> {

	private mobile!: MobileDetect

	constructor() {
		super("mouse-controls", { enable: { type: "boolean", default: true } })
	}

	init() {

		this.mobile = new MobileDetect(window.navigator.userAgent)

		if (!this.mobile.mobile()) {
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
}

new MouseControlsComponent().register()

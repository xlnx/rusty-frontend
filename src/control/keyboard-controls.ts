import * as MobileDetect from "mobile-detect"
import { Component } from "../wasp";

export class KeyboardControlsComponent extends Component<{ enable: boolean }>{

	private mobile!: MobileDetect

	constructor() {
		super("keyboard-controls", { enable: { type: "boolean", default: true } })
	}

	init() {

		this.mobile = new MobileDetect(window.navigator.userAgent)

		if (!this.mobile.mobile()) {
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
}

new KeyboardControlsComponent().register()

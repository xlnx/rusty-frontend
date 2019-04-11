import { ComponentWrapper } from "aframe-typescript-toolkit";
import * as MobileDetect from "mobile-detect"

export class LoggerComponent extends ComponentWrapper<string[]> {

	private mobile!: MobileDetect

	constructor() {
		super("logger", {
			type: "array",
			default: []
		})
	}

	init() {

		this.mobile = new MobileDetect(window.navigator.userAgent)

		if (!this.mobile.mobile()) {
			for (const evt of this.data) {
				this.el.addEventListener(evt, arg => console.log(arg))
			}
		}
	}
}

new LoggerComponent().register()
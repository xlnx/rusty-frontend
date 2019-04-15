import * as MobileDetect from "mobile-detect"
import { Component } from "../wasp";

export class LoggerComponent extends Component<string[]> {

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
				this.listen(evt, arg => console.log(arg))
			}
		}
	}
}

new LoggerComponent().register()
import * as MobileDetect from "mobile-detect"
import { Component } from "../wasp";

export class MouseControlsComponent extends Component<{ enable: boolean }> {

	private mobile!: MobileDetect

	constructor() {
		super("mouse-controls", { enable: { type: "boolean", default: true } })
	}

	init() {

		this.mobile = new MobileDetect(window.navigator.userAgent)

		if (!this.mobile.mobile()) {
			document.addEventListener("click", evt => {
				if (this.data.enable && evt instanceof MouseEvent) {
					this.el.emit("-click", evt)
				}
			})
			document.addEventListener("mousedown", evt => {
				if (this.data.enable && evt instanceof MouseEvent) {
					this.el.emit("-mousedown", evt)
				}
			})
			document.addEventListener("mouseup", evt => {
				if (this.data.enable && evt instanceof MouseEvent) {
					this.el.emit("-mouseup", evt)
				}
			})
			window.addEventListener("wheel", evt => {
				setTimeout(() => {
					// console.log("scroll")
					if (this.data.enable && evt instanceof MouseEvent) {
						this.el.emit("-scroll", evt)
					}
				})
			})
		}
	}
}

new MouseControlsComponent().register()

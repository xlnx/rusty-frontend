import * as MobileDetect from "mobile-detect"
import { Component } from "../wasp";

interface IntergratedControlsComponentSchema {
	readonly hand: string
}

export interface IntergratedMouseEvent {
	readonly sender: AFrame.Entity,
	readonly el: AFrame.Entity,
	readonly isect: THREE.Intersection
}

export class IntergratedControlsComponent extends Component<IntergratedControlsComponentSchema> {

	private mobile!: MobileDetect

	constructor() {
		super("intergrated-controls", {
			hand: {
				type: "string",
				default: "right"
			}
		})
	}

	init() {

		this.mobile = new MobileDetect(window.navigator.userAgent)

		// pc
		this.el.setAttribute("mouse-controls", {})
		this.el.setAttribute("keyboard-controls", {})

		this.el.setAttribute("laser-controls", {
			hand: this.data.hand
		})


		if (!this.mobile.mobile()) {
			this.el.setAttribute("cursor", {
				enabled: false,
				rayOrigin: "mouse"
			})
		}

		const click = (evt: any) => {
			this.el.emit("raw-click", evt)
		}
		const mousedown = (evt: any) => this.el.emit("raw-down", evt)
		const mouseup = (evt: any) => this.el.emit("raw-up", evt)

		this.listen("trackpaddown", click)
		this.listen("-click", click)

		this.listen("trackpaddown", mousedown)
		this.listen("-mousedown", mousedown)

		this.listen("trackpadup", mouseup)
		this.listen("-mouseup", mouseup)
		// daydream.addEventListener("")
	}
}

new IntergratedControlsComponent().register()

interface IntergratedRaycasterSchema {
	readonly objects: string
}

export class IntergratedRaycaster extends Component<IntergratedRaycasterSchema> {

	private isects: THREE.Intersection[] = []
	private selected!: AFrame.Entity

	constructor() {
		super("intergrated-raycaster", {
			objects: {
				type: "string",
				default: "[ray-castable]"
			}
		})
	}

	init() {

		this.el.setAttribute("intergrated-controls", {})

		this.el.setAttribute("line", {
			color: "white",
			opacity: 0.75
		})
		this.el.setAttribute("raycaster", {
			objects: this.data.objects
		})

		const raycaster: any = this.el.components.raycaster

		this.isects = raycaster.intersections

		const click = () => {
			this.updateSelection()
			if (this.selected) {
				const ievt: IntergratedMouseEvent = {
					sender: this.el,
					el: this.selected,
					isect: this.isects[0]
				}
				this.el.emit("int-click", ievt)
				this.selected.emit("int-click", ievt)
			}
		}
		const mousedown = () => {
			this.updateSelection()
			if (this.selected) {
				const ievt: IntergratedMouseEvent = {
					sender: this.el,
					el: this.selected,
					isect: this.isects[0]
				}
				this.el.emit("int-down", ievt)
				this.selected.emit("int-down", ievt)
			}
		}
		const mouseup = () => {
			this.updateSelection()
			if (this.selected) {
				const ievt: IntergratedMouseEvent = {
					sender: this.el,
					el: this.selected,
					isect: this.isects[0]
				}
				this.el.emit("int-up", ievt)
				this.selected.emit("int-up", ievt)
			}
		}

		this.listen("raw-click", click)
		this.listen("raw-down", mousedown)
		this.listen("raw-up", mouseup)

	}

	private updateSelection() {

		if (this.isects.length) {

			const obj: any = this.isects[0].object

			if (obj.el != this.selected) {

				if (!!this.selected) {
					this.selected.emit("int-leave")
				}

				this.selected = obj.el

				this.selected.emit("int-enter")

			}

		} else {

			if (!!this.selected) {

				this.selected.emit("int-leave")
			}

			this.selected = undefined
		}
	}

	tick() {

		this.updateSelection()

	}
}

new IntergratedRaycaster().register()

import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";
import * as MobileDetect from "mobile-detect"

interface IntergratedControlsComponentSchema {
	readonly objects: string
}

export interface IntergratedMouseEvent {
	readonly el: AFrame.Entity,
	readonly isect: THREE.Intersection
}

export class IntergratedControlsComponent extends ComponentWrapper<IntergratedControlsComponentSchema> {

	private mobile!: MobileDetect
	private isects: THREE.Intersection[] = []
	private selected!: AFrame.Entity

	constructor() {
		super("intergrated-controls", {
			objects: {
				type: "string",
				default: "[ray-castable]"
			}
		})
	}

	init() {

		this.mobile = new MobileDetect(window.navigator.userAgent)

		// pc
		this.el.setAttribute("mouse-controls", {})
		this.el.setAttribute("keyboard-controls", {})

		this.el.setAttribute("laser-controls", {
			hand: "right"
		})

		this.el.setAttribute("line", {
			color: "white",
			opacity: 0.75
		})

		if (!this.mobile.mobile()) {
			this.el.setAttribute("cursor", {
				enabled: false,
				rayOrigin: "mouse"
			})
		}
		this.el.setAttribute("raycaster", {
			objects: this.data.objects
		})

		const click = () => {
			this.updateSelection()
			if (this.selected) {
				const ievt: IntergratedMouseEvent = {
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
					el: this.selected,
					isect: this.isects[0]
				}
				this.el.emit("int-up", ievt)
				this.selected.emit("int-up", ievt)
			}
		}

		this.el.addEventListener("trackpaddown", click)
		this.el.addEventListener("-click", click)

		this.el.addEventListener("trackpaddown", mousedown)
		this.el.addEventListener("-mousedown", mousedown)

		this.el.addEventListener("trackpadup", mouseup)
		this.el.addEventListener("-mouseup", mouseup)
		// daydream.addEventListener("")

		const raycaster: any = this.el.components.raycaster

		this.isects = raycaster.intersections
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

new IntergratedControlsComponent().register()

import * as MobileDetect from "mobile-detect"
import { Component } from "../wasp";
import { MessageData } from "../web";

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
		const mousedown = (evt: any) => this.el.emit("raw-down", evt.detail)
		const mouseup = (evt: any) => this.el.emit("raw-up", evt.detail)

		const trackpadtouchstart = (evt: any) => this.el.emit("raw-touchstart", evt.detail)
		const trackpadtouchend = (evt: any) => this.el.emit("raw-touchend", evt.detail)

		// setTimeout(() => {



		// 	const th = 0.3
		// 	const rth = 0.7

		// 	this.subscribe(window["control"], "raw-touchstart", () => {
		// 		first = true
		// 	})
		// 	this.subscribe(window["control"], "raw-touchend", () => {
		// 		first = true
		// 	})

		// 	this.subscribe(window["control"], "raw-axismove", (evt: any) => {

		// 	}, 1000)

		let dx = 0, dy = 0
		let prev: [number, number]
		let first = false

		this.listen("raw-touchstart", () => { first = true })
		this.listen("raw-touchend", () => { first = true })

		const axismove = (evt: any) => {
			let axis: [number, number] = evt.detail.axis

			if (first) {
				dx = dy = 0
			} else {
				dx = axis[0] - prev[0]
				dy = axis[1] - prev[1]
			}
			prev = [axis[0], axis[1]]

			first = false

			let data = {
				dx, dy
			}
			const socket = window['socket']
			socket.socket.send(new MessageData(JSON.stringify(data)).toString());
			this.el.emit("raw-axismove", data)
		}

		this.listen("trackpaddown", click)
		this.listen("-click", click)

		this.listen("trackpaddown", mousedown)
		this.listen("-mousedown", mousedown)

		this.listen("trackpadup", mouseup)
		this.listen("-mouseup", mouseup)

		this.listen("trackpadtouchstart", trackpadtouchstart)
		this.listen("trackpadtouchend", trackpadtouchend)
		this.listen("axismove", axismove)

		this.listen("-scroll", (evt) => {
		 	// console.log(evt)
		 	// const idx = evt.detail.deltaY evt.detail.deltaY)

			const dy = evt.detail.deltaY < 0 ? +0.1 : -0.1

			let data = {
			    dx: 0, dy
			}

			console.log(data)

			this.el.emit("raw-axismove", data)
		})
		// this.listen("raw-touchstart", (evt: any) => {
		// })
		// this.listen("raw-touchend", (evt: any) => {
		// })
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

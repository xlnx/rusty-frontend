declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";
import { isFunction } from "util";

interface ButtonComponentSchema {
	readonly text: string
	readonly width: number
	readonly height: number
	readonly fontSize: number
	readonly buttonDown: string
	readonly buttonUp: string
	readonly buttonClick: string
	readonly buttonSelected: string
	readonly buttonAborted: string
	readonly billboard: boolean
}

export class ButtonComponent extends ComponentWrapper<ButtonComponentSchema> {
	private static numOfButton = 0
	private buttonId: number = ButtonComponent.numOfButton++
	private backEntity: EntityBuilder
	private planeEntity: EntityBuilder
	private buttonEntity: EntityBuilder

	constructor() {
		super("button", {
			text: {
				type: "string",
				default: "btn"
			},
			width: {
				type: "number",
				default: 1
			},
			height: {
				type: "number",
				default: 0
			},
			fontSize: {
				type: "number",
				default: 1
			},
			buttonClick: {
				type: "string",
				default: "button_click"
			},
			buttonDown: {
				type: "string",
				default: "button_down"
			},
			buttonUp: {
				type: "string",
				default: "button_up"
			},
			buttonSelected: {
				type: "string",
				default: "button_selected"
			},
			buttonAborted: {
				type: "string",
				default: "button_aborted"
			},
			billboard: {
				type: "boolean",
				default: true
			}
		})
	}

	init() {
		const data = this.data
		const fontSize = data.fontSize / 10
		const fontWidth = 1
		const fontHeight = 3
		const wrapCount = data.width / fontSize
		const totalWidth = data.width
		const lines = Math.floor(data.text.length / wrapCount)
		const boxDepth = .08

		this.planeEntity = EntityBuilder.create("a-entity", {
			geometry: {
				primitive: "box",
				width: totalWidth,
				height: data.height == 0 ? 'auto' : data.height,
				depth: boxDepth
			},
			position: `0 0 0`,
			text: {
				value: data.text,
				wrapCount: wrapCount,
				align: 'center',
				zOffset: boxDepth
			},
			"ray-castable": {}
		})

		const plane = this.planeEntity.toEntity()

		// this.backEntity = EntityBuilder.create("a-entity", {
		// 	geometry: {
		// 		primitive: "box",
		// 		width: totalWidth * 1.05,
		// 		height: 'auto',
		// 		// depth: boxDepth
		// 	},
		// 	scale: '1 1 .1',
		// 	position: `0 0 -.2`,
		// 	text: {
		// 		value: " ".repeat(data.text.length) + "\n ",
		// 		wrapCount: wrapCount,
		// 		align: 'center'
		// 	}
		// })
		// const back = this.backEntity.toEntity()

		this.buttonEntity = EntityBuilder.create("a-entity", {
			id: `_button_${this.buttonId}`,
		}, [, this.planeEntity,])
			.attachTo(this.el)

		if (data.billboard) {
			this.el.setAttribute('billboard', {})
		}

		let hasBeenDown = false
		plane.addEventListener('int-down', (evt) => {
			this.el.emit(data.buttonDown)
			hasBeenDown = true
		})
		plane.addEventListener('int-up', (evt) => {
			if (hasBeenDown) {
				hasBeenDown = false
				this.el.emit(data.buttonClick)
				this.el.emit(data.buttonUp)
			}
		})
		plane.addEventListener('int-enter', (evt) => {
			this.el.emit('button_selected')
		})


		this.el.addEventListener(data.buttonUp, () => {
			plane.setAttribute("animation", {
				property: "position",
				dir: "normal",
				dur: 250,
				easing: "easeInSine",
				loop: false,
				from: '0 0 -.1',
				to: '0 0 0'
			})
		})

		this.el.addEventListener(data.buttonDown, () => {
			plane.setAttribute("animation", {
				property: "position",
				dir: "normal",
				dur: 250,
				easing: "easeInSine",
				loop: false,
				from: '0 0 0',
				to: '0 0 -.1'
			})
		})

		const rotateAngle = 10
		const rotateTime = 1000
		this.el.addEventListener(data.buttonSelected, () => {

			//  plane.setAttribute("animation", {
			// 	property: "rotation",
			// 	dir: "normal",
			// 	dur: rotateTime * .25,
			// 	easing: "easeInOutSine",
			// 	loop: false,
			// 	from: '0 0 0',
			// 	to: `0 0 ${rotateAngle}`,
			// })
			// plane.setAttribute("animation__2", {
			// 	property: "rotation",
			// 	dir: "normal",
			// 	delay: rotateTime * .26,
			// 	dur: rotateTime * .5,
			// 	easing: "easeInOutSine",
			// 	loop: false,
			// 	from: `0 0 ${rotateAngle}`,
			// 	to: `0 0 -${rotateAngle}*2`,
			// })
			// plane.setAttribute("animation__3", {
			// 	property: "rotation",
			// 	dir: "normal",
			// 	delay: rotateTime * .77,
			// 	dur: rotateTime * .25,
			// 	easing: "easeInOutSine",
			// 	loop: false,
			// 	from: `0 0 -${rotateAngle}*2`,
			// 	to: `0 0 0`,
			// })
		})
	}
}

new ButtonComponent().register()
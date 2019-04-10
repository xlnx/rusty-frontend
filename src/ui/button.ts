declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";

interface ButtonComponentSchema {
	readonly text: string
	readonly width: number
	readonly fontSize: number
	readonly buttonDown: string
	readonly buttonUp: string
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
			fontSize: {
				type: "number",
				default: 0.1
			},
			buttonDown: {
				type: "string",
				default: ""
			},
			buttonUp: {
				type: "string",
				default: ""
			},
			billboard: {
				type: "boolean",
				default: true
			}
		})
	}

	init() {
		const data = this.data

		const fontWidth = 1
		const fontHeight = 3
		const wrapCount = data.width / data.fontSize / fontWidth
		const totalWidth = data.width + 2
		const lines = Math.floor(data.text.length / wrapCount)
		const boxDepth = .1

		this.planeEntity = EntityBuilder.create("a-entity", {
			geometry: {
				primitive: "box",
				width: totalWidth,
				height: 'auto',
				depth: boxDepth
			},
			// scale: '1 1 .1',
			position: `0 0 0`,
			text: {
				value: data.text,
				wrapCount: wrapCount,
				align: 'center',
				zOffset: boxDepth
			},
		})

		const plane = this.planeEntity.toEntity()

		this.backEntity = EntityBuilder.create("a-entity", {
			// geometry: {
			// 	primitive: "box",
			// 	width: totalWidth * 1.05,
			// 	height: 'auto',
			// 	// depth: boxDepth
			// },
			// scale: '1 1 .1',
			// position: `0 0 -.2`,
			// text: {
			// 	value: " ".repeat(data.text.length) + "\n ",
			// 	wrapCount: wrapCount,
			// 	align: 'center'
			// }
		})
		const back = this.backEntity.toEntity()
		// this.backEntity = EntityBuilder.create("a-entity", {
		// 	geometry: {
		// 		primitive: "plane",
		// 		width: totalWidth + 1,
		// 		height: plane.attributes['geometry']['height']
		// 	},
		// 	position: `0 0 -1`
		// })

		this.buttonEntity = EntityBuilder.create("a-entity", {
			id: `_button_${this.buttonId}`,
		}, [this.backEntity, this.planeEntity,])
			.attachTo(this.el)

		if (data.billboard) {
			this.el.setAttribute('billboard', {})
		}

		plane.addEventListener('mousedown', (evt) => {
			console.log('mousedown')
			this.el.emit(`_button_${this.buttonId}_down`)
		})
		plane.addEventListener('mouseup', (evt) => {
			console.log('mouseup')
			this.el.emit(`_button_${this.buttonId}_up`)
		})


		this.el.addEventListener(`_button_${this.buttonId}_up`, () => {
			plane.setAttribute("animation", {
				property: "position",
				dir: "normal",
				dur: 250,
				easing: "easeInSine",
				loop: false,
				from: '0 0 -.1',
				to: '0 0 0'
			})
			if (data.buttonUp != "") this.el.emit(data.buttonUp)
		})

		this.el.addEventListener(`_button_${this.buttonId}_down`, () => {
			plane.setAttribute("animation", {
				property: "position",
				dir: "normal",
				dur: 250,
				easing: "easeInSine",
				loop: false,
				from: '0 0 0',
				to: '0 0 -.1'
			})
			if (data.buttonDown != "") this.el.emit(data.buttonDown)
		})


	}
}

new ButtonComponent().register()
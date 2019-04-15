declare const THREE: typeof import("three")
import { EntityBuilder } from "aframe-typescript-toolkit";
import { Component } from "../wasp";

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

export class ButtonComponent extends Component<ButtonComponentSchema> {
	private static numOfButton = 0
	private buttonId: number = ButtonComponent.numOfButton++
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


		this.listen(data.buttonUp, () => {
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

		this.listen(data.buttonDown, () => {
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

	}
}

new ButtonComponent().register()
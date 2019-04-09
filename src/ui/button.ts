declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";

interface ButtonComponentSchema {
	text: string
	width: number | undefined
	height: number | undefined
	position: string
	readonly buttonDown: string | undefined
	readonly buttonUp: string | undefined
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
				default: undefined
			},
			height: {
				type: "number",
				default: undefined
			},
			position: {
				type: "string",
				default: "0 0 0"
			},
			buttonDown: {
				type: "string",
				default: undefined
			},
			buttonUp: {
				type: "string",
				default: undefined
			},
			billboard: {
				type: "boolean",
				default: true
			}
		})
	}

	init() {
		const data = this.data

		const wrapCount = 40
		const totalWidth = data.text.length * (data.width / wrapCount)


		this.planeEntity = EntityBuilder.create("a-entity", {
			geometry: {
				primitive: "plane",
				width: 'auto',
				height: 'auto'
			},
			position: `0 0 1e-1`,
			text: {
				value: data.text,
				width: data.width ? totalWidth : 'auto',
				height: data.height || 'auto',
				align: 'center'
			}
		})
		const plane = this.planeEntity.toEntity()

		this.backEntity = EntityBuilder.create("a-entity", {
			geometry: {
				primitive: "plane",
				width: plane.attributes['text']['width'],
				height: 'auto'
			}
		})

		this.buttonEntity = EntityBuilder.create("a-entity", {
			position: data.position
		}, [this.planeEntity])
			.attachTo(this.el)

		if (data.billboard) {
			this.el.setAttribute('billboard', {})
		}

		if (data.buttonUp) {
			//need animation
			this.el.addEventListener(`_button_${this.buttonId}_up`, () => {
				this.el.emit(data.buttonUp)
			})
		}
		if (data.buttonDown) {
			//need animation
			this.el.addEventListener(`_button_${this.buttonId}_down`, () => {
				this.el.emit(data.buttonDown)
			})
		}

	}
}
// EntityBuilder.create("a-entity", {
// 	button: new ButtonComponent(new THREE.Vector3(0, 0, 0), "hello\n the world!", 10)
// })

new ButtonComponent().register()


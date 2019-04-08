declare const THREE: typeof import("three")
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";

interface ButtonComponentSchema {
	readonly text: string
}

export class ButtonComponent extends ComponentWrapper<ButtonComponentSchema> {

	private textEntity: EntityBuilder
	private buttonEntity: EntityBuilder
	private planeEntity: EntityBuilder

	constructor(
		public position: THREE.Vector3,
		public text: string,
		public width: number | undefined = undefined,
		public height: number | undefined = undefined,
		public billboard: boolean = true
	) {
		super("button", {
			text: {
				type: "string",
				default: "btn"
			}
		})

		// this.textEntity = EntityBuilder.create("a-text", {
		// 	value: this.text,
		// 	color: "black",
		// 	position: `0 0 0 `
		// })
		// // .attachTo(this.buttonEntity)
		// this.planeEntity = EntityBuilder.create("a-entity", {
		// 	geometry: { primitive: "box" },
		// 	position: `0 0 -1e-1`,
		// 	scale: `${width} ${height} 1e-9`
		// })

		// this.buttonEntity = EntityBuilder.create("a-entity", {
		// 	position: `${this.position.x} ${this.position.y} ${this.position.z}`
		// }, [this.planeEntity, this.textEntity])
		// 	.attachTo(this.el)

		const wrapCount = 40
		const totalWidth = text.length * (width / wrapCount)

		this.planeEntity = EntityBuilder.create("a-entity", {
			geometry: {
				primitive: "box",
				width: 'auto',
				height: 'auto'
			},
			position: `0 0 1e-1`,
			text: {
				value: this.text,
				width: width ? totalWidth : 'auto',
				height: height || 'auto',
				align: 'center'
			}
		})
		this.buttonEntity = EntityBuilder.create("a-entity", {
			position: `${this.position.x} ${this.position.y} ${this.position.z}`
		}, [this.planeEntity])
			.attachTo(this.el)

		if (billboard) {
			this.el.setAttribute('billboard', {})
		}
	}

	init() {
		const entityText = this.el.getAttribute("text")
	}
}

new ButtonComponent(new THREE.Vector3(0, 0, 0), "hello\n the world!", 10).register()

import { ComponentWrapper } from "aframe-typescript-toolkit";

export class RouterItemComponent extends ComponentWrapper<string> {

	constructor() { super("router-item", { type: "string" }) }
}

new RouterItemComponent().register()

interface RouterComponentSchema {
	readonly active: string,
	readonly shared: { [key: string]: any }
}

export class RouterComponent extends ComponentWrapper<RouterComponentSchema> {

	constructor() {

		super("router", {
			active: {
				type: "string"
			},
			shared: {
				type: "map",
				default: {}
			}
		})
	}

	private updateChilds() {

		for (let i = 0; i < this.el.children.length; ++i) {
			const el = <AFrame.Entity>this.el.children[i]
			const com = el.components["router-item"]
			if (!!com) {
				if (com.data == this.data.active) {
					el.play()
				} else {
					el.pause()
				}
			}
		}
	}

	init() {
		this.updateChilds()
	}

	tick() {
		this.updateChilds()
	}
}

new RouterComponent().register()

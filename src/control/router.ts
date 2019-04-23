import { Component } from "../wasp";

export class RouterItemComponent extends Component<string> {

	constructor() { super("router-item", { type: "string" }) }

	init() {
		setTimeout(() => {
			this.el.pause()
		}, 0)
	}
}

new RouterItemComponent().register()

interface RouterComponentSchema {
	readonly active: string,
	readonly shared: { [key: string]: any }
}

export class RouterComponent extends Component<RouterComponentSchema> {

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
					if (!el.isPlaying) {
						el.play()
						el.emit("router-enter")
					}
				} else {
					if (el.isPlaying) {
						el.emit("router-leave")
						el.pause()
					}
				}
			}
		}
	}

	update() {
		console.log(`%c[Router] Activate: ${this.data.active}`, "background: #00cc00; color: #fff")
	}

	tick() {
		this.updateChilds()
	}
}

new RouterComponent().register()

interface RouterSwitchComponentSchema {
	readonly router: AFrame.Entity,
	readonly value: string,
	readonly event: string
}

export class RouterSwitchComponent extends Component<RouterSwitchComponentSchema> {

	constructor() {
		super("router-switch", {
			router: {
				type: "selector"
			},
			value: {
				type: "string"
			},
			event: {
				type: "string"
			}
		})
	}

	init() {
		this.listen(this.data.event, () => {
			this.data.router.setAttribute("router", {
				active: this.data.value
			})
		})
	}
}

new RouterSwitchComponent().register()

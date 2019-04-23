import { BuildingManagerComponent, BasemapComponent } from "./entity";
import { Component } from "./wasp";
import { WebSocketComponent } from "./control";

export class TestButtonComponent extends Component<{}> {

	constructor() {
		super("test-button")
	}

	init() {
		this.listen("button-click", () => console.log("click"))
		this.listen("button-up", () => console.log("up"))
		this.listen("button-down", () => console.log("down"))
	}
}

new TestButtonComponent().register()

export class GameComponent extends Component<{}> {

	private socket!: WebSocketComponent

	constructor() { super("game", {}) }

	init() {

		this.socket = window['socket']

		this.subscribe((<AFrame.Entity>this.el.parentElement), "router-enter", evt => {

			this.socket.el.emit("connect")
			this.subscribe(this.socket.el, "received", msg => {
				console.log(msg.detail.data)
				const basemap: BasemapComponent = window['basemap']
				basemap.import(msg.detail.data)
			})
		})
	}
}

new GameComponent().register()

import { BuildingManagerComponent, BasemapComponent } from "./entity";
import { Component } from "./wasp";
import { WebSocketComponent } from "./control";
import * as UI from "./ui/def"

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

		let entity: AFrame.Entity = document.querySelector("#button-send")
		this.subscribe(entity, UI.click_event, evt => {
			const ws = <WebSocketComponent>window["socket"]
			// console.log(ws)
			const basemap = <BasemapComponent>window["basemap"]
			ws.socket.send(basemap.export().toString())
		})

		this.subscribe((<AFrame.Entity>this.el.parentElement), "router-enter", evt => {

			// this.socket.el.emit("connect")
			this.subscribe(this.socket.el, "received", msg => {
				const { type, data } = msg.detail
				if (type == "Synchronization Data") {
					const basemap: BasemapComponent = window['basemap']
					console.log("received data and importing... ")
					basemap.import(JSON.parse(data))
				}
			})
		})
	}
}

new GameComponent().register()

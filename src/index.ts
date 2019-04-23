import "./control"
import "./entity"
import "./ui"
import "./states"
import "./game"
import "./main"
import "./login"
import { WebSocketComponent } from "./control";
import { Component } from "./wasp";

class TestComponent extends Component<{}> {

	constructor() { super("test", {}) }

	init() {
		const box: AFrame.Entity = window["box"]

		box.setAttribute("material", {
			color: "green"
		})

		const websocket: WebSocketComponent = window["web-socket"]

		this.listen("int-click", (evt: any) => {

			websocket.socket.send("hello world")

			box.setAttribute("material", {
				color: "red"
			})
			setTimeout(() => {
				box.setAttribute("material", {
					color: "green"
				})
			}, 2000)
		})
		// this.listen("trackpaddown", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "green"
		// 	})
		// })
		// this.listen("trackpadup", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "blue"
		// 	})
		// })
		// this.listen("trackpadtouchstart", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "black"
		// 	})
		// })
		// this.listen("trackpadtouchend", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "yellow"
		// 	})
		// })
	}
}

new TestComponent().register()

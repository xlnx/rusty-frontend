import "./control"
import "./entity"
import "./ui"
import "./states"
import "./main"
import { ComponentWrapper } from "aframe-typescript-toolkit";
import { WebSocketComponent } from "./control";

class TestComponent extends ComponentWrapper<{}> {

	constructor() { super("test", {}) }

	init() {
		const box: AFrame.Entity = window["box"]

		box.setAttribute("material", {
			color: "green"
		})

		const websocket: WebSocketComponent = window["web-socket"]

		this.el.addEventListener("int-click", (evt: any) => {

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
		// this.el.addEventListener("trackpaddown", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "green"
		// 	})
		// })
		// this.el.addEventListener("trackpadup", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "blue"
		// 	})
		// })
		// this.el.addEventListener("trackpadtouchstart", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "black"
		// 	})
		// })
		// this.el.addEventListener("trackpadtouchend", (evt: any) => {
		// 	box.setAttribute("material", {
		// 		color: "yellow"
		// 	})
		// })
	}
}

new TestComponent().register()

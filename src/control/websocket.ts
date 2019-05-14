import { Component } from "../wasp";
import { stringify } from "querystring";
import { SynchronizationData, ModelData, MessageData } from "../web";

interface WebSocketComponentSchema {
	readonly host: string,
	readonly port: number,
	readonly protocols: string[],
}

export class WebSocketComponent extends Component<WebSocketComponentSchema> {

	public readonly socket!: WebSocket

	constructor() {
		super("web-socket", {
			host: {
				type: "string"
			},
			port: {
				type: "number"
			},
			protocols: {
				type: "array",
				default: []
			}
		})
	}

	init() {
		// this.el.play()
		setTimeout(() => {

		})
		this.listen("connect", evt => {
			const conn = `ws://${this.data.host}:${this.data.port}/`

			console.log(`%c[Web Socket] Connecting to: ${conn}`, "background: #00cc00; color: #fff")

				// console.log("websocket protocols:", this.data.protocols)

				; (<any>this).socket = new WebSocket(conn, ...this.data.protocols)
			this.socket.onopen = (msg) => {
				console.log("%c[Web Socket] Connection established.", "background: #00cc00; color: #fff")
				this.el.emit("established", msg)
			}

			this.socket.onmessage = (msg) => {
				console.log(`%c[Web Socket] Received: ${msg.data}`, "background: #00cc00; color: #fff")
				const data = JSON.parse(msg.data)
				setTimeout(() => {
					this.el.emit("receive", data)
				})
			}

			this.socket.onclose = (msg) => {
				console.log("%c[Web Socket] Connection closed.", "background: #00cc00; color: #fff")
				this.el.emit("closed", msg)
			}
		})

		this.listen("Add data", msg => {
			const model = msg.detail
			this.socket.send(new SynchronizationData(model).toString())
		})
		this.listen("Require data", msg => {
			console.log("%c[Web Socket] Requiring data from server...", "background: #00cc00; color: #fff")
			this.socket.send(new MessageData("Data required").toString())
		})
	}
}

new WebSocketComponent().register()

export class WebSocketLoggerComponent extends Component<{}> {

	constructor() {
		super("web-socket-logger", {})
	}

	init() {
		this.el.setAttribute("web-socket", {})

		const ws: WebSocketComponent = <any>this.el.components["web-socket"]

		this.listen("connected", () => {
			console.log = (...args: string[]) => {
				for (const arg of args) {
					ws.socket.send(`${this.stringlify(arg)}`)
				}
			}
			console.error = (...args: string[]) => {
				for (const arg of args) {
					ws.socket.send(`[error]: ${this.stringlify(arg)}`)
				}
			}
			console.warn = (...args: string[]) => {
				for (const arg of args) {
					ws.socket.send(`[warn]: ${this.stringlify(arg)}`)
				}
			}
		})

	}

	private stringlify(arg: any): string {

		if (arg instanceof Error) {
			return arg.toString()
		}

		switch (typeof arg) {
			case "number": case "boolean": case "string": return "" + arg
			case "object":
				try {
					return JSON.stringify(arg)
				} catch (error) {
					return "[Object Recursive]"
				}
			default: return typeof arg
		}


	}
}

new WebSocketLoggerComponent().register()

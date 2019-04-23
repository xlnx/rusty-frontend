import { Component } from "../wasp";
import { stringify } from "querystring";

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

		const conn = `ws://${this.data.host}:${this.data.port}/ws`

		console.log(`connecting: ${conn}`)
		console.log("websocket protocols:", this.data.protocols)

			; (<any>this).socket = new WebSocket(conn, ...this.data.protocols)

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

		ws.socket.onopen = () => {
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
		}
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

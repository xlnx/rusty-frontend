import { Component } from "../wasp";

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

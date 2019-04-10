import { ComponentWrapper } from "aframe-typescript-toolkit";

interface WebSocketComponentSchema {
	readonly host: string,
	readonly port: number,
	readonly protocols: string[],
}

export class WebSocketComponent extends ComponentWrapper<WebSocketComponentSchema> {

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

		; (<any>this).socket = new WebSocket(
			`ws://${this.data.host}:${this.data.port}`,
			...this.data.protocols)

	}
}

new WebSocketComponent().register()

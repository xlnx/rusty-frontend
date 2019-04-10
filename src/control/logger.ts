import { ComponentWrapper } from "aframe-typescript-toolkit";

interface LoggerComponentSchema {
	readonly events: string[]
}

export class LoggerComponent extends ComponentWrapper<LoggerComponentSchema> {

	constructor() {
		super("logger", {
			events: {
				type: "array",
				default: []
			}
		})
	}

	init() {
		for (const evt of this.data.events) {
			this.el.addEventListener(evt, () => console.log(evt))
		}
	}
}

new LoggerComponent().register()
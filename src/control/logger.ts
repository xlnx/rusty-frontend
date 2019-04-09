import { ComponentWrapper } from "aframe-typescript-toolkit";

export class LoggerComponent extends ComponentWrapper<{ readonly what: string }> {

	constructor() { super("logger", { what: { type: "string" } }) }

	tick() { console.log(this.data.what) }
}

new LoggerComponent().register()
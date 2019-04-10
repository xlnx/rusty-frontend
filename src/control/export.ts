import { ComponentWrapper } from "aframe-typescript-toolkit";

export class ExportComponent extends ComponentWrapper<string[]> {

	constructor() {
		super("export", {
			type: "array",
			default: []
		})
	}

	update() {
		const wnd = <any>window
		for (const com of this.data) {
			const a = com.split("=", 2)
			if (a.length == 1) a.push(a[0])
			const [dst, src] = a

			console.log(`window["${dst}"] = ${src}`)

			if (src == "[el]") wnd[dst] = this.el
			else wnd[dst] = this.el.components[src]
		}
	}
}

new ExportComponent().register()

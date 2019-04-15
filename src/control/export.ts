import { Component } from "../wasp";

export class ExportComponent extends Component<{ readonly export: string[] }> {

	constructor() {
		super("export", {
			export: {
				type: "array",
				default: []
			}
		})
	}

	update() {
		const wnd = <any>window
		for (const com of this.data.export) {
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

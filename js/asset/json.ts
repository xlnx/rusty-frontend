import { AssetPath } from "./def";

export default class XHRJson {
	constructor(private readonly path: string) { }


	load(): Promise<any> {

		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.responseType = "json"
			xhr.onload = e => resolve(xhr.response)
			xhr.onerror = e => reject(e)
			xhr.open("get", AssetPath + this.path)
			xhr.send()
		})
	}
}
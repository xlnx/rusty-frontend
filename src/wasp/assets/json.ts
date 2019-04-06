import { Asset } from "./asset"

export class JsonAsset extends Asset<{ [key: string]: any }> {

	constructor(path: string) { super(path) }


	load(): Promise<{ [key: string]: any }> {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest()
			xhr.responseType = "json"
			xhr.onload = e => resolve(xhr.response)
			xhr.onerror = e => reject(e)
			xhr.open("get", this.path)
			xhr.send()
		})
	}
}
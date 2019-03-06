import * as THREE from "three"

export default class TexAsset {

	constructor(private readonly path: string) { }

	loadSync(): THREE.Texture {
		let img = new Image()
		let texture = new THREE.Texture(img)
		texture.needsUpdate = true
		img.src = this.path
		return texture
	}

	async load(): Promise<THREE.Texture> {
		return new Promise((resolve, reject) => {
			let img = new Image()
			img.onload = () => {
				let texture = new THREE.Texture(img)
				resolve(texture)
			}
			img.src = this.path
		})
	}
}
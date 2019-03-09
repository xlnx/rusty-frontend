import * as THREEJS from "three"
import * as THREE_ADDONS from "three-addons"
const THREE: typeof import("three") = { ...THREEJS, ...THREE_ADDONS }
import { Asset } from "./asset";

interface Loader {
	load(url: string, onLoad: (e: any) => void, onProgress: (e: any) => void, onError: (e: any) => void): void
}

class PromiselifyLoader<T extends Loader> {

	constructor(
		public readonly wrapped: T,
		private readonly onProgress: (e: any) => void = () => { }
	) { }

	async load(url: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.wrapped.load(url, resolve, this.onProgress, reject)
		})
	}
}

export class ObjAsset extends Asset<THREE.Object3D> {

	constructor(path: string) { super(path) }

	async load(): Promise<THREE.Object3D> {
		return new Promise((resolve, reject) => {
			const mtlLoader = new PromiselifyLoader(new THREE.MTLLoader())
			mtlLoader.wrapped.setMaterialOptions({ side: THREE.DoubleSide })
			mtlLoader.load(this.path.replace(/\.obj$/i, ".mtl"))
				.then(materials => {
					materials.preload()
					const objLoader = new PromiselifyLoader(new THREE.OBJLoader())
					objLoader.wrapped.setMaterials(materials)
					objLoader.load(this.path)
						.then(resolve, e => { console.warn(e); reject(e) })
				}, err => console.warn(err))
		})
	}
}
import * as THREE from "three"
import PromiselifyLoader from "../wrapper/promiselifyLoader";
import { MTLLoader, OBJLoader } from "three-obj-mtl-loader"

export default class ObjAsset {

	constructor(private readonly path: string) { }

	async load(): Promise<any> {
		return new Promise((resolve, reject) => {
			const mtlLoader = new PromiselifyLoader(new MTLLoader())
			mtlLoader.wrapped.setPath("assets/")
			mtlLoader.wrapped.setMaterialOptions({ side: THREE.DoubleSide })
			mtlLoader.load(this.path.replace(/\.obj$/i, ".mtl"))
				.then(materials => {
					materials.preload()
					const objLoader = new PromiselifyLoader(new OBJLoader())
					objLoader.wrapped.setMaterials(materials)
					objLoader.wrapped.setPath("assets/")
					objLoader.load(this.path)
						.then(resolve, e => { console.warn(e); reject(e) })
				}, err => console.warn(err))
		})
	}
}
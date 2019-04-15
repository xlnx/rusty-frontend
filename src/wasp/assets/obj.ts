import { Asset, PromiselifyLoader } from "./asset"

export class ObjAsset extends Asset<THREE.Object3D> {

	async load(): Promise<THREE.Object3D> {
		return new Promise((resolve, reject) => {
			const mtlLoader = new PromiselifyLoader(new THREE.MTLLoader())
			mtlLoader.wrapped.setPath(this.prefix)
			mtlLoader.wrapped.setMaterialOptions({ side: THREE.DoubleSide })
			mtlLoader.load(this.shortName.replace(/\.obj$/i, ".mtl"))
				.then(materials => {
					materials.preload()
					const objLoader = new PromiselifyLoader(new THREE.OBJLoader())
					objLoader.wrapped.setPath(this.prefix)
					objLoader.wrapped.setMaterials(materials)
					objLoader.load(this.shortName)
						.then(resolve, e => { console.warn(e); reject(e) })
				}, err => { console.warn(err); reject(err) })
		})
	}
}

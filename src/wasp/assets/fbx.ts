import { Asset, PromiselifyLoader } from "./asset";

export class FbxAsset extends Asset<THREE.Object3D> {

	async load(): Promise<THREE.Object3D> {
		return new Promise((resolve, reject) => {
			const fbxLoader = new PromiselifyLoader(new THREE.FBXLoader())
			// console.log(fbxLoader.wrapped)
			// fbxLoader.wrapped.setPath(this.prefix)
			// fbxLoader.wrapped.setMaterialOptions({ side: THREE.DoubleSide })
			fbxLoader.load(this.path)
				.then(resolve, e => { console.warn(e); reject(e) })
		})
	}

}
declare let THREE: typeof AFRAME.THREE
import { Asset, PromiselifyLoader } from "./asset";
const FBXLoader = require("three-fbxloader-offical")

export class FbxAsset extends Asset<THREE.Object3D> {

	async load(): Promise<THREE.Object3D> {
		return new Promise((resolve, reject) => {
			const fbxLoader = new PromiselifyLoader(new FBXLoader())
			// console.log(fbxLoader.wrapped)
			// fbxLoader.wrapped.setPath(this.prefix)
			// fbxLoader.wrapped.setMaterialOptions({ side: THREE.DoubleSide })
			fbxLoader.load(this.path)
				.then(resolve, e => { console.warn(e); reject(e) })
		})
	}

}
import * as THREE from "three"
import { Asset } from "./asset";
import { ObjAsset } from "./obj";
import { FbxAsset } from "./fbx";

export class ModelAsset extends Asset<THREE.Object3D> {
	async load(): Promise<THREE.Object3D> {
		return new Promise((resolve, reject) => {
			const idx = this.shortName.lastIndexOf(".") + 1
			const ext = this.shortName.substr(idx).toLowerCase()
			switch (ext) {
				case "obj": return new ObjAsset(this._path).load().then(resolve, reject)
				case "fbx": return new FbxAsset(this._path).load().then(resolve, reject)
				default: reject(`Unknown model format: ${ext}`)
			}
		})
	}
}
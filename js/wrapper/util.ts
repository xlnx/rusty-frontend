import * as THREE from "three"
import { ObjectTag } from "../asset/def"

enum SpecialLayers {
	All = -1
}

class LayeredObject extends THREE.Object3D {

	private readonly _layers: THREE.Object3D[] = []

	get tag(): ObjectTag { return <ObjectTag>this.userData }

	constructor(type: string) {
		super()
		this.userData = <ObjectTag>{
			root: true,
			type: type
		}
	}

	addObjectsToLayer(layer: number | number[], ...object: THREE.Object3D[]) {
		if (typeof layer == "number") {
			layer = [layer]
		}
		for (const l of layer) {
			const f = l == SpecialLayers.All ?
				o => o.traverse(e => e.layers.mask = 0xffffffff) :
				o => o.traverse(e => e.layers.set(l))

			if (!this._layers[l]) {
				this.add(this._layers[l] = new THREE.Object3D())
			}
			for (const obj of object) {
				const o = obj.clone(); f(o); this._layers[l].add(o)
			}
		}
	}

	setMaterial(layer: number, mat: THREE.Material) {
		this._layers[layer].traverse(e => {
			if ((<any>e).isMesh) {
				(<THREE.Mesh>e).material = mat
			}
		})
	}
}

export {
	LayeredObject,
	SpecialLayers
}
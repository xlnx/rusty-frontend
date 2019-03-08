import * as THREE from "three"
import { ObjectTag } from "../asset/def";

function toggleLayer(object: THREE.Object3D, layer: number) {
	object.traverse(e => e.layers.toggle(layer))
}

function setLayer(object: THREE.Object3D, layer: number) {
	object.traverse(e => e.layers.set(layer))
}

function enableLayer(object: THREE.Object3D, layer: number) {
	object.traverse(e => e.layers.enable(layer))
}

function disableLayer(object: THREE.Object3D, layer: number) {
	object.traverse(e => e.layers.disable(layer))
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

	addObjectsToLayer(layer: number, ...object: THREE.Object3D[]) {
		if (!this._layers[layer]) {
			this._layers[layer] = new THREE.Object3D()
			this.add(this._layers[layer])
		}
		for (const obj of object) {
			setLayer(obj, layer)
			this._layers[layer].add(obj)
		}
	}

	setMaterial() {

	}
}

export {
	LayeredObject
}
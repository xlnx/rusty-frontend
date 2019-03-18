import * as THREE from "three"

export enum Layer {
	All = -1
}

export class LayeredView<T extends {} = {}> extends THREE.Object3D {

	public readonly isLayeredView = true

	private readonly _layers: THREE.Object3D[] = []

	get tag() { return <T>this.userData }

	constructor() {
		super()
		this.userData = {}
	}

	add(...object: THREE.Object3D[]): this {
		return this.addToLayer(0, ...object)
	}

	addToLayer(layer: number, ...object: THREE.Object3D[]): this {
		const l = layer
		const f = l == Layer.All ?
			o => o.traverse(e => e.layers.mask = 0xffffffff) :
			o => o.traverse(e => e.layers.set(l))

		if (!this._layers[l]) {
			super.add(this._layers[l] = new THREE.Object3D())
		}
		for (const obj of object) {
			obj.traverse(e => {
				const [m, self] = [<THREE.Mesh>e, this]
				if (m.isMesh) {
					m.onBeforeRender = function () {
						!self.onBeforeRender || self.onBeforeRender.apply(e, <any>arguments)
					}
				}
			})
			f(obj); this._layers[l].add(obj)
		}
		return this
	}

	setMaterial(layer: number, mat: THREE.Material): this {
		this._layers[layer].traverse(e => {
			if ((<any>e).isMesh) {
				(<THREE.Mesh>e).material = mat
			}
		})
		return this
	}

	clone(): this {
		const cc = super.clone();
		(<any>cc)._layers = this._layers
			.map(e => this.children.indexOf(e))
			.map(idx => cc.children[idx])
		return cc
	}
}
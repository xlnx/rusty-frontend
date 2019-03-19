import * as THREE from "three"
import { Thing, ViewType } from "./thing"

interface Point2D { x: number, y: number }

export class Scene<T extends {} = {}> extends THREE.Scene {

	private readonly raycaster = new THREE.Raycaster()

	select(coords: Point2D, camera: THREE.Camera): Thing<T> | undefined {

		this.raycaster.setFromCamera(coords, camera)

		const intersects = this.raycaster.intersectObjects(this.children, true)

		for (let int of intersects) {
			for (let obj = int.object; obj; obj = obj.parent!) {
				const view = <ViewType<T>>obj
				if (view.isLayeredView) {
					return view.tag.thing.owner
				}
			}
		}
	}

	add(...object: (Thing<T> | THREE.Object3D)[]): this {
		for (const v of object) {
			const u = <Thing<T>>v
			super.add(u.isThing ? u.view : <any>u)
		}
		return this
	}

	remove(...object: (Thing<T> | THREE.Object3D)[]): this {
		for (const v of object) {
			const u = <Thing<T>>v
			super.remove(u.isThing ? u.view : <any>u)
		}
		return this
	}

}
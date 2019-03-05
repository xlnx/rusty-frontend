import * as THREE from "three"
import { Scene } from "three";
import { ObjectTag } from "../asset/def";

export default class Selector {

	private readonly raycaster = new THREE.Raycaster()

	constructor(private readonly scene: Scene) { }

	select(coords: { x: number, y: number }, camera: THREE.Camera): { type: string, object: any } | undefined {

		this.raycaster.setFromCamera(coords, camera)
		const intersects = this.raycaster.intersectObjects(this.scene.children, true)

		if (intersects.length) {
			for (let int of intersects) {
				const tag = <ObjectTag>int.object.userData
				if (tag && tag.discard!) {
					continue
				}
				for (let obj = int.object; obj; obj = obj.parent!) {
					const tag = <ObjectTag>obj.userData
					if (tag && tag.root) {
						return <any>tag
					}
				}
			}
		}
	}
}
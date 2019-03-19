import * as THREE from "three"
import { DistUnit } from "../asset/def";

function world2plain(pt3d: THREE.Vector3) {
	const { x, z } = pt3d
	return new THREE.Vector2(x, -z).divideScalar(DistUnit)
}

function plain2world(pt2d: THREE.Vector2) {
	const { x, y } = pt2d
	return new THREE.Vector3(x, 0, -y).multiplyScalar(DistUnit)
}

export {
	world2plain,
	plain2world
}
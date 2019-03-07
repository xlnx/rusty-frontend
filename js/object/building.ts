import * as THREE from "three"
import { DistUnit } from "../asset/def";
import { RoadWidth, BuildingLikeObject } from "../model/def";
import BuildingMathImpl from "../model/building";
import Road from "./road";
import { Basemap } from "../model/basemap";
import { BuildingPrototype } from "../asset/building";

class Building extends BuildingPrototype implements BuildingLikeObject {

	public readonly mathImpl: BuildingMathImpl

	constructor(proto: BuildingPrototype,
		public readonly road: Road,
		public readonly offset: number) {

		super(proto)

		// set pos and orientation of boj
		const angle = Math.PI * 0.25
		this.object.rotateY(angle)

		this.mathImpl = new BuildingMathImpl(this,
			angle, road, offset)
	}
}

class BuildingIndicator extends BuildingPrototype {

	constructor(proto: BuildingPrototype, private readonly basemap: Basemap) {

		super(proto)
	}

	adjust(pt: THREE.Vector2) {
		// const res = this.basemap.alignBuilding(pt, this)
		// if (res) {
		// 	console.log(res)
		// 	const { road, offset, center, angle, valid } = res
		// 	const c = new THREE.Vector3(center.x, 0, center.y).multiplyScalar(DistUnit)
		// 	this.object.position.set(c.x, c.y, c.z)
		// 	this.object.rotation.y = angle
		// } else {
		// 	this.object.rotation.set(0, 0, 0)
		// }
	}

}

export {
	Building, BuildingIndicator
}
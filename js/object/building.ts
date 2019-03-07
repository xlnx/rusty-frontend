import * as THREE from "three"
import BuildingPrototype from "../asset/building";
import { DistUnit } from "../asset/def";
import { RoadWidth, BuildingLikeObject } from "../model/def";
import BuildingMathImpl from "../model/building";
import Road from "./road";

export default class Building extends BuildingPrototype implements BuildingLikeObject {

	public readonly mathImpl: BuildingMathImpl

	constructor(proto: BuildingPrototype,
		public readonly road: Road,
		public readonly offset: number) {

		super(proto)

		// set pos and orientation of boj
		const angle = Math.PI * 0.25
		this.object.rotateY(angle)
		// this.object.translateX()

		// const bbox = new THREE.Box3().setFromObject(this.object)
		// const min = new THREE.Vector2(bbox.min.x, bbox.min.z)
		// 	.divideScalar(DistUnit)
		// const max = new THREE.Vector2(bbox.max.x, bbox.max.z)
		// 	.divideScalar(DistUnit)

		this.mathImpl = new BuildingMathImpl(this,
			angle, road, offset)
	}
}
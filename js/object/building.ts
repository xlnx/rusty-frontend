import * as THREE from "three"
import BuildingPrototype from "../asset/building";
import { DistUnit } from "../asset/def";
import Road from "./road";

export default class Building extends BuildingPrototype {

	private bbox: THREE.Box2
	private rotateAngle: number
	// private road?: Road

	constructor(proto: BuildingPrototype,
		public readonly road: Road,
		private readonly offset: number) {

		super(proto)

		// set pos and orientation of boj
		this.rotateAngle = Math.PI * 0.25
		this.object.rotateY(this.rotateAngle)
		// this.object.translateX()

		const bbox = new THREE.Box3().setFromObject(this.object)
		const min = new THREE.Vector2(bbox.min.x, bbox.min.z)
			.divideScalar(DistUnit)
		const max = new THREE.Vector2(bbox.max.x, bbox.max.z)
			.divideScalar(DistUnit)
		this.bbox = new THREE.Box2(min, max)
	}
}
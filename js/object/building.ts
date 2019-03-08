import * as THREE from "three"
import { BuildingLikeObject } from "../model/def";
import BuildingMathImpl from "../model/building";
import Road from "./road";
import { Basemap } from "../model/basemap";
import { BuildingPrototype } from "../asset/building";
import { plain2world } from "../2d/trans";
import { ObjectTag, CityLayer } from "../asset/def";
import { Thing } from "../wasp";

class BuildingBase extends Thing<ObjectTag> {

	readonly name: string
	readonly placeholder: THREE.Vector2

	constructor(proto: BuildingPrototype) {
		const { name, placeholder, object } = proto
		super(object.clone())

		this.name = name
		this.placeholder = placeholder
		// console.log(this.view)
		// this.view.setMaterial(CityLayer.Origin, new THREE.MeshPhongMaterial({ color: 0xff0000 }))
	}
}

class Building extends BuildingBase implements BuildingLikeObject {

	public readonly mathImpl: BuildingMathImpl

	constructor(proto: BuildingPrototype,
		public readonly road: Road,
		public readonly offset: number) {

		super(proto)

		// set pos and orientation of boj
		const angle = Math.PI * 0.25
		this.view.rotateY(angle)

		this.mathImpl = new BuildingMathImpl(this, angle, road, offset)
	}
}

class BuildingIndicator extends BuildingBase {

	constructor(proto: BuildingPrototype,
		private readonly basemap: Basemap) {

		super(proto)
	}

	adjust(pt: THREE.Vector2) {
		const res = this.basemap.alignBuilding(pt, this.placeholder)
		if (res) {
			const { road, offset, center, angle, valid } = res
			const { x, y, z } = plain2world(center)
			this.view.position.set(x, y, z)
			this.view.rotation.y = angle
		} else {
			const { x, y, z } = plain2world(pt)
			this.view.position.set(x, y, z)
			this.view.rotation.set(0, 0, 0)
		}
	}

}

export {
	Building, BuildingIndicator
}
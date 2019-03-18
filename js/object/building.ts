import * as THREE from "three"
import BasemapBuildingItem from "../model/buildingItem";
import Road from "./road";
import { Basemap } from "../model/basemap";
import { BuildingPrototype } from "../asset/building";
import { plain2world } from "../object/trans";
import { ObjectTag, CityLayer } from "../asset/def";
import { Thing, Layer } from "../wasp";

class BuildingBase extends Thing<ObjectTag> {

	readonly name: string
	readonly placeholder: THREE.Vector2

	constructor(proto: BuildingPrototype) {
		const { name, placeholder, object } = proto
		super()

		this.name = name
		this.placeholder = placeholder
		// console.log(this.view)
		// this.view.setMaterial(CityLayer.Origin, new THREE.MeshPhongMaterial({ color: 0xff0000 }))
	}
}

class Building extends BuildingBase {

	private readonly item: BasemapBuildingItem

	constructor(proto: BuildingPrototype,
		public readonly road: Road,
		public readonly offset: number) {

		super(proto)

		// set pos and orientation of boj
		const angle = Math.PI * 0.25
		this.view.rotateY(angle)

		this.item = new BasemapBuildingItem(this.placeholder, angle, road.item, offset)
	}
}

class BuildingIndicator extends BuildingBase {

	private readonly uniforms = {
		colorValid: { value: new THREE.Vector4(0, 0, 1, 1) },
		colorInvalid: { value: new THREE.Vector4(1, 0, 0, 1) },
		valid: { value: true }
	}

	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2)

	private mat = new THREE.MeshPhongMaterial({
		color: BuildingIndicator.validColor
	})

	constructor(proto: BuildingPrototype,
		private readonly basemap: Basemap<Road, Building>) {

		super(proto)

		const { object } = proto

		this.view.addToLayer(Layer.All, object.model.clone(), object.floor.clone())

		this.view.setMaterial(Layer.All, this.mat)
	}

	adjust(pt: THREE.Vector2) {
		const res = this.basemap.alignBuilding(pt, this.placeholder)
		if (res) {
			const { road, offset, center, angle, valid } = res
			if (this.uniforms.valid.value = valid) {
				this.mat.color.set(BuildingIndicator.validColor)
			} else {
				this.mat.color.set(BuildingIndicator.invalidColor)
			}
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
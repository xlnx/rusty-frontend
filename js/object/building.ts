import * as THREE from "three"
import BasemapBuildingItem from "../model/buildingItem";
import { Road } from "./road";
import { Basemap } from "../model/basemap";
import { BuildingPrototype } from "../asset/building";
import { plain2world } from "../object/trans";
import { ObjectTag, CityLayer } from "../asset/def";
import { Thing, Layer } from "../wasp";
import BasemapRoadItem from "../model/roadItem";

class BuildingBase extends Thing<ObjectTag> {

	readonly name: string
	readonly placeholder: THREE.Vector2

	constructor(proto: BuildingPrototype) {
		const { name, placeholder, object } = proto
		super()

		this.name = name
		this.placeholder = placeholder
	}
}

class Building extends BuildingBase {

	public readonly item: BasemapBuildingItem<Building>

	constructor(
		ind: BuildingIndicator
	) {

		const I = (<any>ind)

		super(I.proto)

		const { object } = I.proto

		const obj = object.model.clone()
		obj.traverse(e => {
			const m = <THREE.Mesh>e
			if (m.isMesh) {
				m.castShadow = true
				m.receiveShadow = true
			}
		})

		// console.log(object.model)
		this.view.addToLayer(CityLayer.Origin, obj)

		// set pos and orientation of boj
		const { x, y, z } = I.view.position
		this.view.position.set(x, y, z)
		this.view.rotation.y = I.view.rotation.y

		// console.log(this.view)

		this.item = new BasemapBuildingItem(this.placeholder, I.angle, I.road, I.offset)
	}
}

class BuildingIndicator extends BuildingBase {

	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(4)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2).multiplyScalar(4)

	private mat = new THREE.MeshPhongMaterial({
		color: BuildingIndicator.invalidColor,
		opacity: 0.4,
		transparent: true,
		polygonOffset: true,
		polygonOffsetFactor: -1e4
	})

	private road?: BasemapRoadItem<Road>
	private offset?: number
	private angle?: number
	private _valid: boolean = false
	get valid() { return this._valid }
	private setValid(val: boolean) {
		if (this._valid = val) {
			this.mat.color.set(BuildingIndicator.validColor)
		} else {
			this.mat.color.set(BuildingIndicator.invalidColor)
		}
	}

	constructor(private readonly proto: BuildingPrototype,
		private readonly basemap: Basemap<Road, Building>) {

		super(proto)

		const { object } = proto

		this.view.addToLayer(CityLayer.Indicator, object.model.clone(), object.floor.clone())

		this.view.setMaterial(CityLayer.Indicator, this.mat)
	}

	adjust(pt: THREE.Vector2) {
		const res = this.basemap.alignBuilding(pt, this.placeholder)
		if (res) {
			const { road, offset, center, angle, valid } = res
			this.road = road
			this.offset = offset
			this.angle = angle
			this.setValid(valid)
			const { x, y, z } = plain2world(center)
			this.view.position.set(x, y, z)
			this.view.rotation.y = angle
		} else {
			const { x, y, z } = plain2world(pt)
			this.setValid(false)
			this.view.position.set(x, y, z)
			this.view.rotation.set(0, 0, 0)
		}
	}

}

export {
	Building, BuildingIndicator
}
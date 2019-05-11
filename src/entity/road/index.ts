import { Road, RoadIndicator } from "./road";
import { TerrainComponent } from "../terrain";
import { BasemapComponent } from "../basemap";
import { Component } from "../../wasp";
import { EntityBuilder } from "aframe-typescript-toolkit";
import BasemapRoadItem from "../../basemap/roadItem";
import { world2plain, plain2world } from "../../legacy";
import { cross2D, cmp } from "../../basemap/geometry";

interface RoadIndicatorComponentSchema {
	readonly width: number,
	readonly from: THREE.Vector2,
	readonly to: THREE.Vector2
}

export class RoadIndicatorComponent extends Component<RoadIndicatorComponentSchema> {

	public readonly indicator!: RoadIndicator

	constructor() {

		super("road-indicator", {
			width: {
				type: "number",
				default: 1
			},
			from: {
				type: "vec2",
				default: new THREE.Vector2()
			},
			to: {
				type: "vec2",
				default: new THREE.Vector2()
			}
		})
	}

	init() {

		const basemap: BasemapComponent = window["basemap"]

		const { width } = this.data

			; (<any>this).indicator = new RoadIndicator(basemap.basemap, width,
				this.data.from, this.data.to)

		this.el.setObject3D("mesh", new THREE.Object3D().add(this.indicator))

		this.listen("locate-road", (evt: any) => {

			const city: AFrame.Entity = window["city-editor"]
			const basemap: BasemapComponent = window["basemap"]

			const { from, to } = this.indicator

			const { added, removed } = basemap.basemap.addRoad(1, from, to)

			for (const road of added) {

				const r = EntityBuilder.create("a-entity", {
					road: {}
				})
					.attachTo(city)
					.toEntity()

					; (<any>r).___my_private_fucking_data = road

			}

		})
	}

	tick() {

		this.indicator.adjustTo(this.data.to, true)

	}
}

new RoadIndicatorComponent().register()

export class RoadComponent extends Component<{ readonly item: any }> {

	public readonly road!: Road

	constructor() {
		super("road", {
			item: {
				type: "array"
			}
		})
	}

	init() {

		const item = (<any>this.el).___my_private_fucking_data
			; (<any>this.el).___my_private_fucking_data = undefined

		// console.log(item)

		const terrain: TerrainComponent = window["terrain"]

			; (<any>this).road = new Road(terrain.terrain, 1, item)

		this.el.setObject3D("mesh", this.road)


		let center = this.road.item.from.clone()
			.add(this.road.item.to)
			.divideScalar(2)
		let faceDir = new THREE.Vector2(0, -1)
		let roadDir = this.road.item.to.clone().sub(this.road.item.from)
		let angleSign = cmp(cross2D(roadDir.clone(), (faceDir)), 0) > 0 ? -1 : 1
		let angle = Math.acos(roadDir.clone().normalize().dot(faceDir)) * angleSign
		let placeHolder = new THREE.Vector2(roadDir.length(), this.road.width)
		terrain.terrain.mark(center, angle, placeHolder)
	}
}

new RoadComponent().register()

import { ComponentWrapper } from "aframe-typescript-toolkit";
import { Road } from "./road";
import { TerrainComponent } from "../terrain";
import { BasemapComponent } from "../basemap";

interface RoadComponentSchema {
	readonly from: { x: number, y: number },
	readonly to: { x: number, y: number }
}

export class RoadComponent extends ComponentWrapper<RoadComponentSchema> {

	public readonly road!: Road

	constructor() {
		super("road", {
			from: {
				type: "vec2"
			},
			to: {
				type: "vec2"
			}
		})
	}

	init() {

		const terrain: TerrainComponent = window["terrain"]
		const basemap: BasemapComponent = window["basemap"]

		const { added, removed } = basemap.basemap.addRoad(1,
			new THREE.Vector2(this.data.from.x, this.data.from.y),
			new THREE.Vector2(this.data.to.x, this.data.to.y))

			; (<any>this).road = new Road(terrain.terrain, 1, added[0])

		console.log(this.road)

		this.el.setObject3D("mesh", new THREE.Object3D().add(this.road))
	}
}

new RoadComponent().register()

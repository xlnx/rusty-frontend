import { ComponentWrapper } from "aframe-typescript-toolkit";
import { Road, RoadIndicator } from "./road";
import { TerrainComponent } from "../terrain";
import { BasemapComponent } from "../basemap";

interface RoadIndicatorComponentSchema {
	readonly width: number,
	readonly from: THREE.Vector2,
	readonly to: THREE.Vector2
}

export class RoadIndicatorComponent extends ComponentWrapper<RoadIndicatorComponentSchema> {

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

		const { from, width, to } = this.data
			; (<any>this).indicator = new RoadIndicator(basemap.basemap, width, from, to)
		this.el.setObject3D("mesh", new THREE.Object3D().add(this.indicator))
	}

	tick() {
		this.indicator.adjustTo(this.data.to, true)
	}
}

new RoadIndicatorComponent().register()

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

		const from = new THREE.Vector2(this.data.from.x, this.data.from.y)
		const to = new THREE.Vector2(this.data.to.x, this.data.to.y)

		const { added, removed } = basemap.basemap.addRoad(1, from, to)

			; (<any>this).road = new Road(terrain.terrain, 1, added[0])

		this.el.setObject3D("mesh", this.road)

		// const ind = new RoadIndicator(basemap.basemap, 1, from, to)
		// // console.log(this.road)
		// this.el.setObject3D("mesh", new THREE.Object3D().add(ind))

		// const handlers = {
		// 	"validate-road": (evt: any) => {

		// 	},
		// 	"locate-road": (evt: any) => {

		// 	}
		// }

		// for (const name in handlers) {
		// 	this.el.addEventListener(name, handlers[name])
		// }
	}
}

new RoadComponent().register()

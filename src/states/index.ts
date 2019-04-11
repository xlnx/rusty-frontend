import { EntityBuilder, ComponentWrapper } from "aframe-typescript-toolkit";
import { TerrainComponent, BasemapComponent, BuildingComponent } from "../entity";
import { plain2world } from "../legacy";

class BuildingStateComponent extends ComponentWrapper<{}> {

	private current!: BuildingComponent

	constructor() {
		super("building-state", {})
	}

	init() {
	}

	tick() {

		const terrain: TerrainComponent = window["terrain"]
		const raycaster = window["terrain-raycaster"]
		const isects = raycaster.intersections

		if (isects.length) {

			const city = window["city-editor"]

			const xy = terrain.terrain.coordCast(isects[0])

			if (!this.current) {

				const xyz = plain2world(xy)
				console.log(xy)
				console.log(xyz)
				this.current = <any>EntityBuilder.create("a-entity", {
					building: {
						name: "Building_Bar"
					},
					position: xyz
				})
					.attachTo(city)
					.toEntity()
					.components.building
			} else {

				const basemap: BasemapComponent = window["basemap"]
				const { road, offset, center, angle, valid } =
					basemap.basemap.alignBuilding(xy, this.current.proto.placeholder)

				const { x, y, z } = plain2world(center)

				this.current.el.object3D.position.set(x, y, z)
				this.current.el.object3D.rotation.y = angle

				this.current.el.emit("validate-building", valid)

			}
			// console.log(x, y)

		}
	}
}

new BuildingStateComponent().register()

export class RoadStateComponent extends ComponentWrapper<{}> {

	constructor() {
		super("road-state", {})
	}

	init() {
	}
}
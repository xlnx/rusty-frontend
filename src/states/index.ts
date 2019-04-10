import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";
import { TerrainComponent } from "../entity";
import { plain2world } from "../legacy";

class BuildingStateComponent extends ComponentWrapper<{}> {

	private current!: AFrame.Entity

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
			const xyz = plain2world(xy)

			if (!this.current) {

				console.log(xy)
				console.log(xyz)
				this.current = EntityBuilder.create("a-entity", {
					building: {
						name: "Building_Bar"
					},
					position: xyz
				})
					.attachTo(city)
					.toEntity()
			} else {

				const { x, y, z } = xyz
				this.current.object3D.position.set(x, y, z)
				// this.current.setAttribute("position", xyz)

			}
			// console.log(x, y)

		}
	}
}

new BuildingStateComponent().register()

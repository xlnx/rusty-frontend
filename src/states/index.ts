import { EntityBuilder } from "aframe-typescript-toolkit";
import { BasemapComponent, BuildingComponent, RoadIndicatorComponent } from "../entity";
import { plain2world } from "../legacy";
import { Component } from "../wasp";

export class BuildingStateComponent extends Component<{}> {

	private current!: BuildingComponent
	private valid: boolean = false

	constructor() {
		super("building-state", {})
	}

	init() {

		this.listen("router-enter", () => {
			this.current = undefined
			this.valid = false
		})

		this.listen("router-leave", () => {
			if (!!this.current) {
				this.current.el.parentNode.removeChild(this.current.el)
				this.current = undefined
			}
		})

		this.subscribe(this.el.sceneEl.querySelector("[main]"), "raw-click", () => {
			if (!!this.current && this.valid) {
				this.current.el.emit("locate-building")
				this.current = undefined
			}
		})

		this.subscribe(window["terrain"].el, "terrain-intersection-update", evt => {

			const city = window["city-editor"]
			const xy: THREE.Vector2 = evt.detail

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

				this.valid = valid

			}

		})

	}
}

new BuildingStateComponent().register()

export class RoadStateComponent extends Component<{}> {

	private current!: AFrame.Entity

	constructor() {
		super("road-state", {})
	}

	init() {

		this.listen("router-enter", () => {
			this.current = undefined
		})
		this.listen("router-leave", () => {
			if (!!this.current) {
				this.current.parentNode.removeChild(this.current)
				this.current = undefined
			}
		})

		let xy!: THREE.Vector2

		this.subscribe(window["terrain"].el, "terrain-intersection-update", evt => {

			xy = evt.detail
			if (!!this.current) {
				this.current.setAttribute("road-indicator", {
					to: xy
				})
			}

		})

		this.subscribe(window["terrain"].el, "int-click", (evt: any) => {

			const city = window["city-editor"]

			if (!this.current) {

				this.current = EntityBuilder.create("a-entity", {
					"road-indicator": {
						from: xy.clone(),
						to: xy.clone()
					}
				})
					.attachTo(city)
					.toEntity()

			} else {

				const indicator = <RoadIndicatorComponent>this.current.components["road-indicator"]

				if (indicator.indicator && indicator.indicator.valid) {

					this.current.emit("locate-road")
					this.current.parentNode.removeChild(this.current)
					this.current = undefined

				}
			}

		})
	}
}

new RoadStateComponent().register()

export class PreviewState extends Component<{}> {
	constructor() { super("preview-state", {}) }
}

new PreviewState().register()

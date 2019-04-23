import { EntityBuilder } from "aframe-typescript-toolkit";
import { BasemapComponent, BuildingComponent, RoadIndicatorComponent, TerrainComponent } from "../entity";
import { plain2world, DistUnit } from "../legacy";
import { Component } from "../wasp";
import BasemapBuildingItem from "../basemap/buildingItem";
import { Point } from "../basemap/geometry";
import { PointComponent } from "../entity/geometry";
import { Vector2 } from "three";
import { PointDetectRadius } from "../basemap/def";

export class BuildingStateComponent extends Component<{}> {

	private current!: BuildingComponent
	private valid: boolean = false

	constructor() {
		super("building-state", {})
	}

	init() {

		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-enter", () => {
			this.current = undefined
			this.valid = false
		})

		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-leave", () => {
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
				// console.log(xy)
				// console.log(xyz)
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
				const para = basemap.basemap.alignBuilding(xy, this.current.proto.placeholder)
				const { road, offset, center, angle, valid } = para


				this.current.para = para

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
	private pointIdk!: AFrame.Entity
	private points!: AFrame.Entity
	private map: Map<Point, AFrame.Entity> = new Map()
	private leave: boolean

	constructor() {
		super("road-state", {})
	}

	init() {

		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-enter", () => {
			this.current = undefined
			this.leave = false
		})
		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-leave", () => {
			if (!!this.current) {
				this.current.parentNode.removeChild(this.current)
				this.current = undefined
			}
			this.leave = true
		})

		let xy!: THREE.Vector2
		const city = window["city-editor"]
		const basemap: BasemapComponent = window["basemap"]
		const self = this
		this.subscribe(window["terrain"].el, "terrain-intersection-update", evt => {

			// in model coordinates
			xy = evt.detail
			// road indicator
			if (!!this.current) {
				this.current.setAttribute("road-indicator", {
					to: xy
				})
			}
			// mouse point indicator
			if (!this.pointIdk) {
				this.pointIdk = EntityBuilder.create("a-entity", {
					"point": {
						dash: false
					},
					visible: true
				})
					.attachTo(city)
					.toEntity()

				self.listen("router-leave", () => {
					this.pointIdk.setAttribute('visible', false)
				})
				self.listen("router-enter", () => {
					this.pointIdk.setAttribute('visible', true)
				})

			}
			const pt = plain2world(basemap.basemap.attachNearPoint(xy))
			this.pointIdk.setAttribute('position', {
				x: pt.x,
				y: pt.y,
				z: pt.z
			})
		})

		this.subscribe(window["terrain"].el, "int-click", (evt: any) => {
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

					// update created points
					if (!this.points) {
						this.points = EntityBuilder.create("a-entity", {
						})
							.attachTo(city)
							.toEntity()
					}
					let pt = basemap.basemap.getNearPoint(indicator.indicator.from)
					if (pt) {
						const pt2d = pt
						const pt3d = plain2world(pt)
						if (!this.map.has(pt)) {
							const ptEntity = EntityBuilder.create("a-entity", {
								"point": {
									dash: true
								},
								position: {
									x: pt3d.x,
									y: pt3d.y,
									z: pt3d.z
								},
								visible: true
							})
								.attachTo(this.points)
								.toEntity()
							this.map.set(pt, ptEntity)
							self.subscribe(window["terrain"].el, "terrain-intersection-update", evt => {
								const mousePos: Vector2 = evt.detail
								if (mousePos.distanceTo(pt2d) > PointDetectRadius) {
									ptEntity.setAttribute('visible', false)
								} else {
									ptEntity.setAttribute('visible', true)
								}
							})
							self.listen("router-leave", () => {
								ptEntity.setAttribute('visible', false)
							})

						}
					}
					pt = basemap.basemap.getNearPoint(indicator.indicator.to)
					if (pt) {
						const pt2d = pt
						const pt3d = plain2world(pt)
						if (!this.map.has(pt)) {
							const ptEntity = EntityBuilder.create("a-entity", {
								"point": {
									dash: true
								},
								position: {
									x: pt3d.x,
									y: pt3d.y,
									z: pt3d.z
								},
								visible: true
							})
								.attachTo(this.points)
								.toEntity()
							this.map.set(pt, ptEntity)
							self.subscribe(window["terrain"].el, "terrain-intersection-update", evt => {
								const mousePos: Vector2 = evt.detail
								if (mousePos.distanceTo(pt2d) > PointDetectRadius) {
									ptEntity.setAttribute('visible', false)
								} else {
									ptEntity.setAttribute('visible', true)
								}
							})
							self.listen("router-leave", () => {
								ptEntity.setAttribute('visible', false)
							})
						}
					}

					this.current = undefined
				} else {
					this.current.parentNode.removeChild(this.current)
					this.current = undefined
				}
			}
		})
	}
}

new RoadStateComponent().register()

export class PreviewStateComponent extends Component<{}> {
	constructor() { super("preview-state", {}) }
}

new PreviewStateComponent().register()

export class MorphStateComponent extends Component<{}> {

	private isMorphing: boolean = false
	private xy!: THREE.Vector2

	constructor() { super("morph-state", {}) }

	init() {

		const terrain: TerrainComponent = window["terrain"]

		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-enter", () => {
			this.isMorphing = false
		})
		this.listen("router-exit", () => {
			this.isMorphing = false
		})

		this.subscribe(terrain.el, "terrain-intersection-update", (evt: any) => {
			this.xy = evt.detail
		})

		this.subscribe(terrain.el, "int-down", (evt: any) => {
			this.isMorphing = true
		})
		this.subscribe(terrain.el, "int-up", (evt: any) => {
			this.isMorphing = false
		})
	}

	tick(time: number, timeDelta: number) {

		const terrain: TerrainComponent = window["terrain"]

		if (this.isMorphing) {
			if (!!this.xy) {
				try {
					terrain.terrain.morph({
						center: this.xy,
						radius: 10,
						speed: 1e-1,
						dt: timeDelta
					})
				} catch (error) {
					console.error(error)
				}
			}
		}
	}
}

new MorphStateComponent().register()

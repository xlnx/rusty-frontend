import { EntityBuilder } from "aframe-typescript-toolkit";
import { BasemapComponent, BuildingComponent, RoadIndicatorComponent, TerrainComponent, RoadComponent, BuildingIndicatorComponent } from "../entity";
import { plain2world, DistUnit } from "../legacy";
import { Component, EventController } from "../wasp";
import BasemapBuildingItem from "../basemap/buildingItem";
import { Point } from "../basemap/geometry";
import { PointComponent } from "../entity/geometry";
import { Vector2, Vector3 } from "three";
import { PointDetectRadius } from "../basemap/def";
import * as UI from "../ui/def";
import { WebSocketComponent } from "../control";
import { WheelComponent } from "../ui";


export class SelectStateComponent extends Component<{}>{
	private solved: Map<AFrame.Entity, number> = new Map()
	private current: AFrame.Entity
	// private selecting: boolean
	private static validBuildingMaterial = new THREE.MeshStandardMaterial({
		color: BuildingIndicatorComponent.validColor,
		side: THREE.DoubleSide,
		opacity: 0.5,
		transparent: true
	})
	private static validRoadMaterial = new THREE.MeshStandardMaterial({
		color: BuildingIndicatorComponent.validColor,
		side: THREE.DoubleSide,
		opacity: 0.5,
		transparent: true
	})
	constructor() {
		super("select-state", {})
	}
	init() {
		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-enter", () => {
			this.current = undefined
			// this.selecting = true
		})

		this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-leave", () => {
			// if (this.current != undefined) {
			// 	this.current.object3D.traverse((node) => {
			// 		const ele = <THREE.Mesh>node
			// 		if (ele.isMesh) {
			// 			; (<any>ele.material) = this.oldMat
			// 		}
			// 	})
			// }
			this.current = undefined
			// this.selecting = true
		})

		let xy!: THREE.Vector2
		const city: AFrame.Entity = window["city-editor"]
		const basemap: BasemapComponent = window["basemap"]
		const self = this
		this.subscribe(city, "int-enter", evt => {
			const target: AFrame.Entity = evt.target
			let component: BuildingComponent | RoadComponent
			// if (this.selecting) {
			component = <BuildingComponent>target.components["building"] || <RoadComponent>target.components["road"]
			if (component != undefined) {
				component.preSelect()
				// console.log("set1")
				if (!this.solved.has(target)) {
					self.subscribe(city, "int-leave", evt => {
						if (this.current != target && evt.target == target && !evt.target.hasAttribute('terrain')) {
							// console.log("unset1")
							component.unselect()
						}
					})
					self.subscribe(city, "int-click", evt => {
						const ent: AFrame.Entity = evt.target
						// console.log(ent)
						if (ent != target && !ent.hasAttribute('terrain')) {
							// console.log("unset2")
							component.unselect()
						}
					})
					self.subscribe(<AFrame.Entity>(this.el.parentElement), "router-leave", () => {
						component.unselect()
					})
					this.solved.set(target, 1)
				}
			}
			// }
		})
		// this.subscribe(city, "int-leave", evt => {
		// 	const target: AFrame.Entity = evt.target
		// 	if (this.selecting &&
		// 		(target.hasAttribute("building") || target.hasAttribute("road"))
		// 	) {
		// 		this.current = evt.target

		// 		// (<BuildingComponent>this.current.components['building']).object.
		// 	}
		// })
		this.subscribe(city, "int-click", evt => {
			// console.log("int-click")
			const entity = evt.target
			if (!entity.hasAttribute('terrain')) {

				const target = entity
				this.current = target
				let component: BuildingComponent | RoadComponent = <BuildingComponent>target.components["building"] || <RoadComponent>target.components["road"]
				if (component != undefined) {
					component.select()
					// console.log("set2")
					const wheelEntity = EntityBuilder.create("a-entity", {
						wheel: {
							outerRadius: 3
						},
						visible: true,
						billboard: true
					})
						.attachTo(city)
						.toEntity()

					const box = new THREE.Box3().setFromObject(this.current.object3D)
					const height = box.max.y
					const { x, z } = box.min.clone().add(box.max).divideScalar(2)
					wheelEntity.setAttribute("position", {
						x: x,
						y: height + .2,
						z: z
					})
					wheelEntity.setAttribute("scale", {
						x: .1,
						y: .1,
						z: .1
					})
					const removeEntity = () => {
						try {
							const socket: WebSocketComponent = window['socket']
							if (entity.hasAttribute("building")) {
								const building: BuildingComponent = <BuildingComponent>entity.components["building"]
								const item = building.building
								console.log('[basemap] removing a building...')
								basemap.basemap.removeBuilding(item)
								socket.el.emit("Add data", {
									state: "remove",
									roads: [],
									buildings: [{
										center: item.center,
										prototype: item.proto.name
									}]
								})
								entity.parentNode.removeChild(entity)
								console.log('[basemap] successfully removed a building.')
							}
							else if (entity.hasAttribute("road")) {
								const road: RoadComponent = <RoadComponent>entity.components["road"]
								const item = road.road.item
								console.log('[basemap] removing a road...')
								basemap.basemap.removeRoad(item)
								socket.el.emit("Add data", {
									state: "remove",
									roads: [{
										width: item.width,
										from: item.from,
										to: item.to
									}],
									buildings: []
								})
								entity.parentNode.removeChild(entity)
								console.log('[basemap] successfully removed a road.')
							}
						} catch (err) {
							console.log(`[basemap] error at removing entity: ${err}`)
						}
					}
					// if (this.solved.get(target) == 1) {
					const handlers: EventController[] = []
					const removeWheel = () => {
						const par = wheelEntity.parentNode
						par.removeChild(wheelEntity)
						handlers.forEach((handler: EventController) => {
							handler.cancel()
						})
						console.log("removeWheel")
					}

					handlers.push(self.subscribe(wheelEntity, UI.click_event, evt => {
						removeEntity()
						removeWheel()
					}))

					handlers.push(self.subscribe(city, "int-click", evt => {
						const ent: AFrame.Entity = evt.target
						// console.log(ent)
						if (ent != target && !ent.hasAttribute('terrain')) {
							removeWheel()
						}
					}))
					handlers.push(self.subscribe(<AFrame.Entity>(self.el.parentElement), "router-leave", () => {
						removeWheel()
					}))

					self.solved.set(target, 2)
					// }

				}
			}
		})
	}
}
new SelectStateComponent().register()
export class BuildingStateComponent extends Component<{}> {

	private current!: BuildingComponent
	private valid: boolean = false
	private my_fucking_data: any

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
				this.current.el.emit("locate-building", this.my_fucking_data)
				this.current.el.parentNode.removeChild(this.current.el)
				this.current = undefined
			}
		})

		this.subscribe(window["terrain"].el, "terrain-intersection-update", evt => {

			const city = window["city-editor"]
			const xy: THREE.Vector2 = evt.detail.clone()

			if (!this.current) {

				const xyz = plain2world(xy)
				// console.log(xy)
				// console.log(xyz)
				this.current = <any>EntityBuilder.create("a-entity", {
					"building-indicator": {
						name: "Building_Bar"
					},
					position: xyz
				})
					.attachTo(city)
					.toEntity()
					.components["building-indicator"]
			} else {

				const basemap: BasemapComponent = window["basemap"]
				const modelInfo = basemap.basemap.alignBuilding(xy, this.current.proto.placeholder)
				const { road, offset, center, angle, valid } = modelInfo
				// console.log(modelInfo)
				const { x, y, z } = plain2world(center)

				this.current.el.object3D.position.set(x, y, z)
				this.current.el.object3D.rotation.y = angle

				this.current.el.emit("validate-building", valid)

				this.valid = valid

				this.my_fucking_data = modelInfo

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
	init() { }
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
						radius: 6,
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

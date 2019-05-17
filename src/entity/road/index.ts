import { Road, RoadIndicator } from "./road";
import { TerrainComponent } from "../terrain";
import { BasemapComponent } from "../basemap";
import { Component } from "../../wasp";
import { EntityBuilder } from "aframe-typescript-toolkit";
import BasemapRoadItem from "../../basemap/roadItem";
import { world2plain, plain2world } from "../../legacy";
import { cross2D, cmp } from "../../basemap/geometry";
import { WebSocketComponent } from "../../control";
import { Selectable } from "../selectable";

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
			// send data to server
			const socket: WebSocketComponent = window['socket']
			removed.forEach(road => {
				socket.el.emit("Add data", {
					state: "remove",
					roads: [{
						width: road.width,
						from: road.from,
						to: road.to
					}],
					buildings: []
				})
			})
			added.forEach(road => {
				socket.el.emit("Add data", {
					state: "insert",
					roads: [{
						width: road.width,
						from: road.from,
						to: road.to
					}],
					buildings: []
				})
			})

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

export class RoadComponent extends Component<{ readonly item: any }> implements Selectable {

	public readonly road!: Road

	constructor() {
		super("road", {
			item: {
				type: "array"
			}
		})
	}

	init() {
		this.el.setAttribute("ray-castable", {})
		const item = (<any>this.el).___my_private_fucking_data
			; (<any>this.el).___my_private_fucking_data = undefined

		// console.log(item)

		const terrain: TerrainComponent = window["terrain"]

			; (<any>this).road = new Road(terrain.terrain, 1, item)
		this.road.userData = this.el

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

		// restore material
		this.road.traverse((node) => {
			const ele = <THREE.Mesh>node
			if (ele.isMesh) {
				this.originMaterial = (<any>ele.material)
			}
		})
	}
	originMaterial: THREE.Material
	selectMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0.44, 0.52, 0.84).multiplyScalar(2),
		side: THREE.DoubleSide,
		opacity: 0.5,
		transparent: true
	})
	preSelect() {
		this.road.traverse((node) => {
			// console.log(node)
			const ele = <THREE.Mesh>node
			if (ele.isMesh) {
				; (<any>ele.material) = this.selectMaterial
			}
		})
	}
	select() {
		this.preSelect()
	}
	unselect() {
		this.road.traverse((node) => {
			// console.log(node)
			const ele = <THREE.Mesh>node
			if (ele.isMesh) {
				; (<any>ele.material) = this.originMaterial
			}
		})
	}
}

new RoadComponent().register()

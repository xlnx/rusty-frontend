import { Basemap } from "../../basemap/basemap";
import { Road } from "../road/road";
import { Component, JsonAsset } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { BuildingManagerComponent, BuildingComponent } from "../building";
import { EntityBuilder } from "aframe-typescript-toolkit";
import { plain2world } from "../../legacy";
import { RoadData, BuildingData, ModelData, WebData, SynchronizationData } from "../../web";
import BasemapRoadItem from "../../basemap/roadItem";

export class BasemapComponent extends Component<{}> {

	public readonly basemap: Basemap<Road, {}> = new Basemap()

	constructor() {
		super("basemap", {})
	}
	init() {
		// setTimeout(() => {

		// 	new JsonAsset("basemap/roads.json").load().then((Roads: any) => {
		// 		console.log(Roads)
		// 		try {
		// 			const city = window["city-editor"]
		// 			const basemap = this.basemap
		// 			// const webData = <WebData>JSON.parse(data)
		// 			const lastCount = Basemap.count
		// 			const roads = Roads.roads
		// 			roads.forEach((road: RoadData) => {
		// 				// console.log(road)
		// 				const { width, from, to } = road
		// 				const fromVec = new THREE.Vector2(from[0], from[1])
		// 				const toVec = new THREE.Vector2(to[0], to[1])
		// 				if (basemap.alignRoad(new BasemapRoadItem(width, fromVec, toVec))) {
		// 					const { added, removed } = basemap.addRoad(width, fromVec, toVec)
		// 					for (const road of added) {
		// 						const r = EntityBuilder.create("a-entity", {
		// 							road: {}
		// 						})
		// 							.attachTo(city)
		// 							.toEntity()
		// 							; (<any>r).___my_private_fucking_data = road
		// 					}
		// 				}
		// 			})
		// 		}
		// 		catch (err) {
		// 			console.log(`[Basemap] Error at importing data from server: ${err}`)
		// 		}
		// 	})
		// }, 5000)
	}

	export(): WebData {
		const roadData: RoadData[] = []
		const roads = this.basemap.getAllRoads()
		roads.forEach(road => {
			roadData.push({
				from: road.from,
				to: road.to,
				width: road.width
			})
		})

		const buildingData: BuildingData[] = []
		const buildings = this.basemap.getAllBuildings()
		buildings.forEach(building => {
			buildingData.push({
				prototype: building.proto.name,
				center: building.center
			})
		})
		const modelData: ModelData = {
			state: "insert",
			roads: roadData,
			buildings: buildingData
		}
		const ret = new SynchronizationData(modelData)
		return ret
		// return JSON.stringify(webData, null, 4)
	}
	reset(data: SynchronizationData) {
		Object.assign(this.basemap, new Basemap())
		this.import(data)
	}
	import(data: SynchronizationData) {
		try {
			const city = window["city-editor"]
			const basemap = this.basemap
			const manager = <BuildingManagerComponent>window['building-manager']

			const { state, roads, buildings } = data.data
			if (state == "insert") {
				// const lastCount = Basemap.count
				roads.forEach((road: RoadData) => {
					const { width, from, to } = road
					const fromVec = new THREE.Vector2(from.x, from.y)
					const toVec = new THREE.Vector2(to.x, to.y)
					const { added, removed } = basemap.addRoad(width, fromVec, toVec)
					for (const road of added) {
						const r = EntityBuilder.create("a-entity", {
							road: {}
						})
							.attachTo(city)
							.toEntity()
							; (<any>r).___my_private_fucking_data = road
					}
				})

				buildings.forEach((building: BuildingData) => {
					const { prototype, center } = building
					const proto = manager.manager.get(prototype)
					const entity = EntityBuilder.create("a-entity", {
						building: {
							name: prototype
						},
					})
						.attachTo(city)
						.toEntity()
					const component = <BuildingComponent>entity.components.building
					const pos = new THREE.Vector2(center.x, center.y)
					const modelInfo = basemap.alignBuilding(pos, proto.placeholder)
					const { angle, valid } = modelInfo

					component.modelInfo = modelInfo

					const { x, y, z } = plain2world(pos)

					entity.object3D.position.set(x, y, z)
					entity.object3D.rotation.y = angle

					// entity.object3D.position.set(x, y, z)
					// entity.object3D.rotation.y = angle
					// component.locateBuilding()
					setTimeout(() => {
						entity.emit("locate-building")
						entity.emit("validate-building", valid)
					}, 0)
				})
			} else if (state == "remove") {
				roads.forEach((road: RoadData) => {
					const { width, from, to } = road
					const fromVec = new THREE.Vector2(from.x, from.y)
					const toVec = new THREE.Vector2(to.x, to.y)
					const center = fromVec.clone()
						.add(toVec)
						.divideScalar(2)
					const item = basemap.selectRoad(center)
					if (item) {
						basemap.removeRoad(item)
					}
				})

				buildings.forEach((building: BuildingData) => {
					const { prototype, center } = building
					const item = basemap.selectBuilding(center)
					if (item) basemap.removeBuilding(item)
				})
			}

		}
		catch (err) {
			console.log(`[Basemap] Error at importing data from server: ${err}`)
		}
	}

}

new BasemapComponent().register()

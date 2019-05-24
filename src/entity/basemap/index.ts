import { Basemap } from "../../basemap/basemap";
import { Road } from "../road/road";
import { Component, JsonAsset } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { BuildingManagerComponent, BuildingComponent } from "../building";
import { EntityBuilder } from "aframe-typescript-toolkit";
import { plain2world } from "../../legacy";
import { RoadData, BuildingData, ModelData, WebData, SynchronizationData } from "../../web";
import BasemapRoadItem from "../../basemap/roadItem";
import { MessageData } from "../../web";

export class BasemapComponent extends Component<{}> {

	public readonly basemap: Basemap<Road, BuildingComponent> = new Basemap<Road, BuildingComponent>()

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

	export(): ModelData {
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
		return modelData
		// return JSON.stringify(webData, null, 4)
	}
	reset(data: ModelData) {
		Object.assign(this.basemap, new Basemap<Road, BuildingComponent>())
		this.import(data)
	}
	import(data: ModelData) {
		setTimeout(() => {
		try {
			const city = window["city-editor"]
			const basemap = this.basemap
			const manager = <BuildingManagerComponent>window['__fuck_manager']

			const { state, roads, buildings } = data
			if (state == "insert") {
				const socket = window["socket"]

				socket.socket.send(new MessageData("here to add roads").toString())

				// const lastCount = Basemap.count
				roads.forEach((road: RoadData) => {
					const { width, from, to } = road
					const fromVec = new THREE.Vector2(from.x, from.y)
					const toVec = new THREE.Vector2(to.x, to.y)
					const { added, removed } = basemap.addRoad(width, fromVec, toVec)
					for (const road of added) {

					    	const socket = window["socket"]
						window["__fuck_you_data"] = road

						const r = EntityBuilder.create("a-entity", {
							road: {}
						})
							.attachTo(city)
							.toEntity()
							; (<any>r).___my_private_fucking_data = road
					}
				})

				socket.socket.send(new MessageData("here to add buildings").toString())

				buildings.forEach((building: BuildingData) => {

					const { prototype, center } = building
					const proto = manager.manager.get(prototype)

					console.log("importing: ", prototype, ", ", center)
					console.log("with manager: ", manager.manager)
					console.log("with manager: ", (<any>manager.manager).resources)
					socket.socket.send(new MessageData(manager.manager.getList() + "").toString())

					console.log("with manager list: ", manager.manager.getList())
					console.log("with proto: ", proto) 


					const pos = new THREE.Vector2(center.x, center.y)
					const modelInfo = basemap.alignBuilding(pos, proto.placeholder)
					window["__fuck_data"] = modelInfo
					
					const entity = EntityBuilder.create("a-entity", {
						building: {
							name: prototype
						}
					})
						.attachTo(city)
						.toEntity()

						; (<any>entity).___my_private_fucking_data = modelInfo

					const { x, y, z } = plain2world(pos)

					// entity.object3D.position.set(x, y, z)
					// entity.object3D.rotation.y = angle
					// component.locateBuilding()
					// setTimeout(() => {
					// if (modelInfo.valid) {
					// 	entity.emit("locate-building", modelInfo)
					// }
					// entity.emit("validate-building", valid)
					// }, 0)
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
					// console.log(`road:${item}`)
					if (item != undefined) {
						console.log('[basemap] removing a road...')
						basemap.removeRoad(item)
						const entity = (<AFrame.Entity>item.userData.userData)
						// console.log(entity)
						entity.parentNode.removeChild(entity)
						console.log('[basemap] successfully removed road.')
					}
				})

				buildings.forEach((building: BuildingData) => {
					const { center } = building
					const pos = new THREE.Vector2(center.x, center.y)
					const item = basemap.selectBuilding(pos)
					if (item != undefined) {
						console.log('[basemap] removing a building...')
						basemap.removeBuilding(item)
						const entity = item.userData.el
						entity.parentNode.removeChild(entity)
						console.log('[basemap] successfully removed building.')
					}
				})
			}
		}
		catch (err) {
		        const socket = window["socket"]
			socket.socket.send(new MessageData(err + "").toString())
			console.log(`[Basemap] Error at importing data from server: ${err}`)
		}
		}, 100)
	}

}

new BasemapComponent().register()

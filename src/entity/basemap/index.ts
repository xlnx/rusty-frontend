import { Basemap } from "../../basemap/basemap";
import { Road } from "../road/road";
import { Component } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
import { BuildingManagerComponent, BuildingComponent } from "../building";
import { EntityBuilder } from "aframe-typescript-toolkit";
import { plain2world } from "../../legacy";
declare type RoadData = {
	from: THREE.Vector2,
	to: THREE.Vector2,
	width: number,
}
declare type BuildingData = {
	prototype: string,
	center: THREE.Vector2
}
interface WebData {
	type: string,
	data: any
}
type ModelData = {
	roads: RoadData[],
	buildings: BuildingData[]
}

export class BasemapComponent extends Component<{}> {

	public readonly basemap: Basemap<Road, {}> = new Basemap()

	constructor() {
		super("basemap", {})
		this.export()
	}

	export(): string {
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
			roads: roadData,
			buildings: buildingData
		}
		const webData: WebData = {
			type: "synchronize",
			data: modelData
		}
		return JSON.stringify(webData, null, 4)
	}
	reset(data: string) {
		Object.assign(this.basemap, new Basemap())
		this.import(data)
	}
	import(data: string) {
		try {
			const city = window["city-editor"]
			const basemap = this.basemap
			const webData = <WebData>JSON.parse(data)
			const modelData = <ModelData>webData.data
			const roads = modelData.roads
			const lastCount = Basemap.count
			roads.forEach(road => {
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

			const buildings = modelData.buildings
			const manager = <BuildingManagerComponent>window['building-manager']
			buildings.forEach(building => {
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

				entity.object3D.position.set(x, y, z)
				entity.object3D.rotation.y = angle
				component.init()
				component.locateBuilding()
				// entity.emit("locate-building")
				entity.emit("validate-building", valid)
			})
		}
		catch (err) {
			console.log(`[Basemap] Error at importing data from server: ${err}`)
		}
	}
}

new BasemapComponent().register()

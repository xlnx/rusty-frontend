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
declare type WebData = {
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
		return JSON.stringify({ roads: roadData, buildings: buildingData }, null, 4)
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
			const roads = webData.roads
			const lastCount = Basemap.count
			roads.forEach(road => {
				const { width, from, to } = road
				const { added, removed } = basemap.addRoad(width, from, to)
				for (const road of added) {
					const r = EntityBuilder.create("a-entity", {
						road: {}
					})
						.attachTo(city)
						.toEntity()
						; (<any>r).___my_private_fucking_data = road
				}
			})

			const buildings = webData.buildings
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

				const modelInfo = basemap.alignBuilding(center, proto.placeholder)
				const { angle, valid } = modelInfo


				component.modelInfo = modelInfo

				const { x, y, z } = plain2world(center)

				entity.object3D.position.set(x, y, z)
				entity.object3D.rotation.y = angle

				entity.object3D.position.set(x, y, z)
				entity.object3D.rotation.y = angle
				entity.emit("locate-building")
				entity.emit("validate-building", valid)
			})
		}
		catch (err) {
			console.log(`[Basemap] Error at importing data from server: ${err}`)
		}
	}
}

new BasemapComponent().register()

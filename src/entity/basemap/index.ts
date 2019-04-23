import { Basemap } from "../../basemap/basemap";
import { Road } from "../road/road";
import { Component } from "../../wasp";
import BasemapBuildingItem from "../../basemap/buildingItem";
declare type RoadData = {
	from: THREE.Vector2,
	to: THREE.Vector2,
	width: number,
}
declare type BuildingData = {
	prototype: string,
	angle: number,
	road: number,
	offset: number
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
				angle: building.angle,
				road: roads.indexOf(building.road),
				offset: building.offset
			})
		})
		return JSON.stringify({ roads: roadData, buildings: buildingData }, null, 4)
	}
	import(data: string) {
		Object.assign(this.basemap, new Basemap())
		try {
			const webData = <WebData>JSON.parse(data)
			const roads = webData.roads


			const buildings = webData.buildings
			buildings.forEach(building => {

			})
		}
		catch (err) {
			console.log(`[Basemap] Error at importing data from server: ${err}`)
		}
	}
}

new BasemapComponent().register()

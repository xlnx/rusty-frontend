// const RoadWidth = 1
const mapWidth = 500
const mapHeight = 500
const maxBuildings = 100
const maxRoads = 100

import * as THREE from "three"
import BasemapBuildingItem from "./building";
import BasemapRoadItem from "./road";


interface QuadTreeItem<T={}> {
    x: number,
    y: number,
    width: number,
    height: number,
    obj?: T
    // obj?: BasemapRoadItem | BasemapBuildingItem
}

abstract class UserData<T> {
    public userData?: T
}

// interface RoadLikeObject {
//     readonly width: number
//     readonly item: BasemapRoadItem
//     destroy()
// }

// interface BuildingLikeObject {
//     readonly placeholder: THREE.Vector2
//     readonly item: BasemapBuildingItem
//     destroy()
// }

export {
    QuadTreeItem,
    mapWidth, mapHeight, maxBuildings, maxRoads,
    UserData
    // RoadLikeObject, BuildingLikeObject,
}
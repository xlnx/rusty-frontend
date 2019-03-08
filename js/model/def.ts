// const RoadWidth = 1
const mapWidth = 500
const mapHeight = 500
const maxBuildings = 100
const maxRoads = 100

import * as THREE from "three"
import BuildingMathImpl from "./building";
import RoadMathImpl from "./road";


type quadTreeItem = {
    x: number,
    y: number,
    width: number,
    height: number,
    obj?: RoadMathImpl | BuildingMathImpl
}

interface RoadLikeObject {
    readonly width: number
    readonly mathImpl: RoadMathImpl
}

interface BuildingLikeObject {
    readonly placeholder: THREE.Vector2
    readonly mathImpl: BuildingMathImpl
}

export {
    quadTreeItem,
    mapWidth, mapHeight, maxBuildings, maxRoads,
    RoadLikeObject, BuildingLikeObject,
}
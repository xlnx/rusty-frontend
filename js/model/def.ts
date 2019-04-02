// const RoadWidth = 1
const mapWidth = 500
const mapHeight = 500
const maxBuildings = 100
const maxRoads = 100
const PointDetectRadius = 16
const AttachRadius = 3
const minRoadLength = AttachRadius + 0.1
const roadHeight = 0.2

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
export {
    QuadTreeItem,
    mapWidth,
    mapHeight,
    maxBuildings,
    maxRoads,
    PointDetectRadius,
    AttachRadius,
    minRoadLength,
    roadHeight,
    UserData
    // RoadLikeObject, BuildingLikeObject,
}
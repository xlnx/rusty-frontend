// const RoadWidth = 1
export const mapWidth = 500
export const mapHeight = 500
export const maxBuildings = 1000
export const maxRoads = 1000
export const PointDetectRadius = 16
export const AttachRadius = 3
export const minRoadLength = AttachRadius + 0.1
export const roadHeight = 0.2
export const defaultRoadSelectionRange = 5
export const defaultBuildingSelectionRange = 8

export interface QuadTreeItem<T = {}> {
    x: number,
    y: number,
    width: number,
    height: number,
    obj?: T
    // obj?: BasemapRoadItem | BasemapBuildingItem
}

export abstract class UserData<T> {
    public userData?: T
}

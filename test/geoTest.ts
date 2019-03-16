import { Seg2D, AnyRect2D } from "../js/model/geometry";
import * as THREE from "three"
import BasemapRoadItem from "../js/model/road";
import BasemapBuildingItem from "../js/model/building";
import { Basemap } from "../js/model/basemap";
const { Vector2: vec2 } = THREE

class Road {
    readonly item

    constructor(
        readonly width: number,
        readonly from: THREE.Vector2,
        readonly to: THREE.Vector2
    ) {
        this.item = new BasemapRoadItem(width, from, to)
    }

    destroy() { }
}

class Building {
    readonly item

    constructor(
        readonly angle: number,
        readonly road: Road,
        readonly offset: number,
        readonly placeholder: THREE.Vector2
    ) {
        this.item = new BasemapBuildingItem(placeholder, 0, road.item, offset)
    }

    destroy() { }
}

it("asdasd", () => {

    let road = new Road(1, new vec2(10, 0), new vec2(0, -10))
    let bm = new Basemap()
    bm.addRoad(1, road.from, road.to)
    const placeholder = new THREE.Vector2(4, 4)
    const { center, angle, valid } = bm.alignBuilding(new THREE.Vector2(6, -6), placeholder)!
    console.log(center)
    console.log(angle / Math.PI * 180.)
    console.log(valid)

})
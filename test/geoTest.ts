import { Seg2D, AnyRect2D } from "../js/model/geometry";
import * as THREE from "three"
import { RoadLikeObject, BuildingLikeObject } from "../js/model/def";
import RoadMathImpl from "../js/model/road";
import BuildingMathImpl from "../js/model/building";
import { Basemap } from "../js/model/basemap";
const { Vector2: vec2 } = THREE

class Road implements RoadLikeObject {
    readonly mathImpl

    constructor(
        readonly width: number,
        readonly from: THREE.Vector2,
        readonly to: THREE.Vector2
    ) {
        this.mathImpl = new RoadMathImpl(this, from, to)
    }
}

class Building implements BuildingLikeObject {
    readonly mathImpl

    constructor(
        readonly angle: number,
        readonly road: RoadLikeObject,
        readonly offset: number,
        readonly placeholder: THREE.Vector2
    ) {
        this.mathImpl = new BuildingMathImpl(this, 0, road, offset)
    }
}

it("asdasd", () => {

    let road = new Road(1, new vec2(10, 0), new vec2(0, -10))
    let bm = new Basemap(Road)
    bm.addRoad(1, road.from, road.to)
    const placeholder = new THREE.Vector2(4, 4)
    const { center, angle, valid } = bm.alignBuilding(new THREE.Vector2(6, -6), placeholder)!
    console.log(center)
    console.log(angle / Math.PI * 180.)
    console.log(valid)

})
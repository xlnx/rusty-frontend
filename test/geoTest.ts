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

    let road = new Road(new vec2(5, 5), new vec2(-5, -5))
    let bm = new Basemap(Road)
    bm.addRoad(new THREE.Vector2(-5, -5), new THREE.Vector2(5, 5))
    const placeholder = new THREE.Vector2(4, 4)
    // console.log(bm.roadTree)
    console.log(bm.alignBuilding(new THREE.Vector2(0, 0), placeholder))

})
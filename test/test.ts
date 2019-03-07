import * as THREE from "three"
import { RoadLikeObject, BuildingLikeObject } from "../js/model/def";
import BuildingMathImpl from "../js/model/building";
import RoadMathImpl from "../js/model/road";
import { Basemap } from "../js/model/basemap";


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

it("test", () => {

    const bm = new Basemap(Road)

    let as = bm.addRoad(new THREE.Vector2(1, 0), new THREE.Vector2(3, 4))
    let bs = bm.addRoad(new THREE.Vector2(2, 0), new THREE.Vector2(4, 8))
    // let info = bm.alignBuilding()
    let building = new Building(
        0, as[0], 0, new THREE.Vector2(4, 4)
    )
    bm.addBuilding(building)
    console.log(bm.buildingTree[0])

    // let basemap = new Basemap(Road)

    // basemap.addRoad(A.from, A.to)
    // console.log("origin road")
    // console.log("a")
    // console.log(A)
    // console.log("b")
    // console.log(B)
    // basemap.addRoad(B.from, B.to)
    // console.log("new roads")
    // console.log(basemap.roadTree)
})

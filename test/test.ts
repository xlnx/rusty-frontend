import * as THREE from "three"
import { RoadLikeObject, BuildingLikeObject } from "../js/model/def";
import BuildingMathImpl from "../js/model/building";
import { RoadMathImpl, Basemap } from "../js/model/basemap";


class Road implements RoadLikeObject {
    readonly mathImpl = new RoadMathImpl(this)

    constructor(
        readonly from: THREE.Vector2,
        readonly to: THREE.Vector2
    ) { }
}

class Building implements BuildingLikeObject {
    readonly mathImpl = new BuildingMathImpl(this)

    constructor(readonly bbox2d: THREE.Box2,
        readonly angle: number,
        readonly road: RoadLikeObject,
        readonly offset: number,
        readonly placeholder: THREE.Vector2
    ) { }
}
it("test", () => {
    let A = new Road(new THREE.Vector2(1, 0), new THREE.Vector2(4, 6))
    let B = new Road(new THREE.Vector2(2, 0), new THREE.Vector2(4, 8))


    let building = new Building(
        new THREE.Box2(new THREE.Vector2(0, 0), new THREE.Vector2(4, 4)),
        0, A, 0, new THREE.Vector2(4, 4)
    )

    let basemap = new Basemap(Road)

    basemap.addRoad(A.from, A.to)
    console.log("origin road")
    console.log("a")
    console.log(A)
    console.log("b")
    console.log(B)
    basemap.addRoad(B.from, B.to)
    console.log("new roads")
    console.log(basemap.roadTree)
})

import { Road, Basemap } from "../model/basemap";
import * as THREE from "three"
import "mocha"
import * as should from "should"

it("road rec", () => {
    let A = new Road(new THREE.Vector2(1, 0), new THREE.Vector2(4, 6))
    let B = new Road(new THREE.Vector2(2, 0), new THREE.Vector2(4, 8))
    let basemap = new Basemap()

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
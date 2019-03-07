import { Seg2D, AnyRect2D } from "../js/model/geometry";
import * as THREE from "three"
const { Vector2: vec2 } = THREE

function newRect(pts: number[][]) {
    return pts.map(arr => new vec2(arr[0], arr[1]))
}

it("geo test", () => {
    let recApts = newRect([[0, 1], [1, 0], [4, 3], [3, 4]])
    let recA = new AnyRect2D(recApts)
    let recBpts = newRect([[0, 0], [1, -1], [0, -2], [-1, -1]])
    let recB = new AnyRect2D(recBpts)
    console.log(recA.intersect(recB))
})

import { Seg2D, AnyRect2D } from "../js/model/geometry";
import * as THREE from "three"
const { Vector2: vec2 } = THREE

function newRect(pts: number[][]) {
    return pts.map(arr => new vec2(arr[0], arr[1]))
}

// it("geo test", () => {
let recApts = newRect([[0, 1], [1, 0], [4, 3], [3, 4]])
let recA = new AnyRect2D(recApts)
let ydif = 0
let xdif = 0
console.log(new AnyRect2D(newRect([[1, 1 + ydif], [1, -1 + ydif], [-1, -1 + ydif], [-1, 1 + ydif]])).intersect(
    new AnyRect2D(newRect([[2, 0], [4, 2], [2, 4], [0, 2]]))))
// let recBpts = newRect([[0 + xdif, 1 + ydif], [1 + xdif, 0 + ydif], [0 + xdif, -1 + ydif], [-1 + xdif, 0 + ydif]])
// let recB = new AnyRect2D(recBpts)
// console.log(new vec2(0, 1).rotateAround(new vec2(1, 0), Math.PI / 2))
// console.log(recA.intersect(recB))
// })

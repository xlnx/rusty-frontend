const RoadWidth = 1

import * as THREE from "three"

function inBox(min: Point, pts: Point[], max: Point): boolean {
    for (let pt of pts) {
        if (
            pt.x > min.x &&
            pt.x < max.x &&
            pt.y > min.y &&
            pt.y < max.y
        ) return true
    }
    return false
}

function minPt(pts: Point[]): Point {
    let res = pts[0]
    for (let pt of pts) {
        if (pt.x < res.x) res.x = pt.x
        if (pt.y < res.y) res.y = pt.y
    }
    return res
}

function maxPt(pts: Point[]): Point {
    let res = pts[0]
    for (let pt of pts) {
        if (pt.x > res.x) res.x = pt.x
        if (pt.y > res.y) res.y = pt.y
    }
    return res
}

declare type Point = THREE.Vector2
export {
    RoadWidth, Point, inBox, minPt, maxPt
}
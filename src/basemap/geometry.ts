import { QuadTreeItem, distOfPtOnLine } from "./def";
import * as THREE from "three";

function cross2D(a: THREE.Vector2, b: THREE.Vector2): number {
    return a.x * b.y - a.y * b.x
}

function inBox(min: Point, pts: Point[], max: Point): boolean {
    for (let pt of pts) {
        if (
            cmp(pt.x, min.x) > 0 &&
            cmp(pt.x, max.x) < 0 &&
            cmp(pt.y, min.y) > 0 &&
            cmp(pt.y, max.y) < 0
        ) return true
    }
    return false
}

function minPt(pts: Point[]): Point {
    let res = new THREE.Vector2(Infinity, Infinity)
    for (let pt of pts) {
        if (cmp(pt.x, res.x) < 0) res.x = pt.x
        if (cmp(pt.y, res.y) < 0) res.y = pt.y
    }
    return res
}

function maxPt(pts: Point[]): Point {
    let res = new THREE.Vector2(-Infinity, -Infinity)
    for (let pt of pts) {
        if (cmp(pt.x, res.x) > 0) res.x = pt.x
        if (cmp(pt.y, res.y) > 0) res.y = pt.y
    }
    return res
}

function copyPts(pts: Point[]): Point[] {
    let res: Point[] = []
    for (let pt of pts)
        res.push(pt.clone())
    return res
}

const eps = 1e-3
// <:-1, =:0, >:1
function cmp(a: number, b: number): number {
    const val = a - b
    return Math.abs(val) < eps ? 0 : val > 0 ? 1 : -1
}
function cmpPt(a: Point, b: Point): boolean {
    return (cmp(a.distanceTo(b), 0) == 0)
}


declare type Point = THREE.Vector2;

class Seg2D {
    constructor(
        readonly from: THREE.Vector2,
        readonly to: THREE.Vector2
    ) { }
    intersect(other: Seg2D, flag: boolean = true): boolean {
        //1.rapid judge: rectangle coincide
        let a = this.from
        let b = this.to
        let c = other.from
        let d = other.to
        // console.log("this seg:", this)
        // console.log("other seg:", other)
        if (
            cmp(Math.min(a.x, b.x), Math.max(c.x, d.x)) <= 0 &&
            cmp(Math.max(a.x, b.x), Math.min(c.x, d.x)) >= 0 &&
            cmp(Math.min(a.y, b.y), Math.max(c.y, d.y)) <= 0 &&
            cmp(Math.max(a.y, b.y), Math.min(c.y, d.y)) >= 0
        ) {
            // console.log("Rec conincide")
            //possibly line conincide
            let ab = b.clone().sub(a)
            let ac = c.clone().sub(a)
            let ad = d.clone().sub(a)
            let ca = a.clone().sub(c)
            let cd = d.clone().sub(c)
            let cb = b.clone().sub(c)
            //2.cross standing experiment
            if (flag) {
                return cmp(cross2D(ac, ab) * cross2D(ad, ab), 0) <= 0 &&
                    cmp(cross2D(ca, cd) * cross2D(cb, cd), 0) <= 0
            }
            else return cmp(cross2D(ac, ab) * cross2D(ad, ab), 0) < 0 &&
                cmp(cross2D(ca, cd) * cross2D(cb, cd), 0) < 0
        }
        return false
    }
    distance(pt: Point): number {
        let ab = this.to.clone().sub(this.from)
        let ac = pt.clone().sub(this.from)
        return Math.abs(cross2D(ab, ac)) / ab.length()
    }
    ptOnLine(pt: Point): boolean {
        if (this.distance(pt) < distOfPtOnLine) {
            const ap = pt.clone().sub(this.from)
            const bp = pt.clone().sub(this.to)
            const ab = this.to.clone().sub(this.from)
            const ba = ab.clone().negate()
            if (ap.dot(ab) >= 0 && bp.dot(ba) >= 0) {
                return true
            }
        }
        return false
        // let p = pt
        // let pa = this.from.clone()
        //     .sub(p)
        // let pb = this.to.clone()
        //     .sub(p)
        // return cmp(pa.dot(pb), 0) == 0
    }
    length(): number {
        return this.from.clone().sub(this.to).length()
    }
    angle(other: Seg2D): number {
        const a = this.to.clone().sub(this.from).normalize()
        const b = other.to.clone().sub(other.from).normalize()
        return Math.acos(a.dot(b))
    }
    clone(): Seg2D {
        return new Seg2D(this.from, this.to)
    }
    reverseClone(): Seg2D {
        return new Seg2D(this.to, this.from)
    }
}

class AnyRect2D {
    private bbox2d: THREE.Box2 = <any>null
    constructor(private readonly pts: THREE.Vector2[]) {
        this.bbox2d = new THREE.Box2(minPt(this.pts), maxPt(this.pts))
    }

    containPts(pts: Point[]): boolean {
        for (const pt of pts) {
            if (this.containPt(pt)) return true
        }
        return false
    }

    containPt(pt: Point): boolean {
        let pts = this.pts
        let product: number[] = []
        let AB = pts[1].clone().sub(pts[0])
        let AP = pt.clone().sub(pts[0])
        product.push(cross2D(AB, AP))

        let BC = pts[2].clone().sub(pts[1])
        let BP = pt.clone().sub(pts[1])
        product.push(cross2D(BC, BP))
        if (cmp(product[0] * product[1], 0) <= 0) return false

        let CD = pts[3].clone().sub(pts[2])
        let CP = pt.clone().sub(pts[2])

        product.push(cross2D(CD, CP))
        if (cmp(product[1] * product[2], 0) <= 0) return false

        let DA = pts[0].clone().sub(pts[3])
        let DP = pt.clone().sub(pts[3])
        product.push(cross2D(DA, DP))
        return cmp(product[2] * product[3], 0) <= 0 ? false : true

    }

    intersect(other: AnyRect2D): boolean {
        if (!other.bbox2d.intersectsBox(this.bbox2d)) return false
        //assume road width is integer

        let origin = new THREE.Vector2(0, 0)
        let otherPts = other.pts
        let otherDir = otherPts[1].clone().sub(otherPts[0])
        let otherAngle = Math.acos(otherDir.clone().normalize().x) * otherDir.y < 0 ? -1 : 1

        let thisPts = this.pts
        let thisDir = thisPts[1].clone().sub(thisPts[0])
        let thisAngle = Math.acos(thisDir.clone().normalize().x) * thisDir.y < 0 ? -1 : 1

        let thisPtsInOther = new AnyRect2D(otherPts).containPts(thisPts)
        let otherPtsInThis = new AnyRect2D(thisPts).containPts(otherPts)
        //case 1
        if (thisPtsInOther || otherPtsInThis) return true
        //case 2

        const a1 = [
            new Seg2D(otherPts[0], otherPts[2]),
            new Seg2D(otherPts[1], otherPts[3])
        ]
        const b1 = [
            new Seg2D(thisPts[0], thisPts[2]),
            new Seg2D(thisPts[1], thisPts[3])
        ]
        for (const se of a1) {
            for (const sq of b1) {
                if (se.intersect(sq, false)) {
                    return true
                }
            }
        }
        return false
    }

    treeItem(): QuadTreeItem {
        let min = minPt(this.pts)
        let max = maxPt(this.pts)
        return {
            x: min.x,
            y: min.y,
            width: max.x - min.x,
            height: max.y - min.y
        }

    }
}
class ParallelRect2D extends AnyRect2D {
    constructor(pt: Point, radius: number) {
        let rect = [
            pt.clone().add(new THREE.Vector2(radius / 2, radius / 2)),
            pt.clone().add(new THREE.Vector2(radius / 2, -radius / 2)),
            pt.clone().add(new THREE.Vector2(-radius / 2, -radius / 2)),
            pt.clone().add(new THREE.Vector2(-radius / 2, radius / 2))
        ]
        super(rect)
    }
}


export {
    inBox, minPt, maxPt, Point, cmp, cmpPt,
    cross2D,
    Seg2D, AnyRect2D, ParallelRect2D
}
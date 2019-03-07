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
    let res = pts[0].clone()
    for (let pt of pts) {
        if (pt.x < res.x) res.x = pt.x
        if (pt.y < res.y) res.y = pt.y
    }
    return res
}

function maxPt(pts: Point[]): Point {
    let res = pts[0].clone()
    for (let pt of pts) {
        if (pt.x > res.x) res.x = pt.x
        if (pt.y > res.y) res.y = pt.y
    }
    return res
}

function copyPts(pts: Point[]): Point[] {
    let res: Point[] = []
    for (let pt of pts)
        res.push(pt.clone())
    return res
}

const eps = 1e-2
// <:1, =:0, >:-1
function cmp(a: number, b: number): number {
    const val = b - a
    return Math.abs(val) < eps ? 0 : val > 0 ? 1 : -1
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
        const [e, f] = [minPt([a, b]), maxPt([a, b])]
        const [g, h] = [minPt([c, d]), maxPt([c, d])]
        if (new THREE.Box2(e, f).intersectsBox(new THREE.Box2(g, h)))
        // if (
        //     Math.min(a.x, b.x) <= Math.max(c.x, d.x) &&
        //     Math.max(a.x, b.x) >= Math.min(c.x, d.x) &&
        //     Math.min(a.y, b.y) <= Math.max(c.y, d.y) &&
        //     Math.max(a.y, b.y) >= Math.min(c.y, d.y)
        // )
        {
            //possibly line conincide
            let ab = b.clone().sub(a)
            let ac = c.clone().sub(a)
            let ad = d.clone().sub(a)
            let ca = a.clone().sub(c)
            let cd = d.clone().sub(c)
            let cb = b.clone().sub(c)
            //2.cross standing experiment
            if (flag) {
                return cmp((<any>ac).cross(ab) * (<any>ad).cross(ab), 0) >= 0 &&
                    cmp((<any>ca).cross(cd) * (<any>cb).cross(cd), 0) >= 0
            }
            else return cmp((<any>ac).cross(ab) * (<any>ad).cross(ab), 0) > 0 &&
                cmp((<any>ca).cross(cd) * (<any>cb).cross(cd), 0) > 0
        }
        return false
    }
    distance(pt: Point): number {
        let ab = this.to.clone().sub(this.from)
        let ac = pt.clone().sub(this.from)
        return Math.abs((<any>ab).cross(ac)) / ab.length()
    }

}

class AnyRect2D {
    private bbox2d: THREE.Box2 = <any>null
    constructor(private readonly pts: THREE.Vector2[]) {
        this.bbox2d = new THREE.Box2(minPt(this.pts), maxPt(this.pts))
    }


    intersect(other: AnyRect2D): boolean {
        if (!other.bbox2d.intersectsBox(this.bbox2d)) return false
        //assume road width is integer

        let otherPts = other.pts
        let otherDir = otherPts[1].clone().sub(otherPts[0])
        let otherAngle = Math.acos(otherDir.clone().normalize().x)
        // console.log(otherPts, otherDir, otherAngle)

        let thisPts = this.pts
        let thisDir = thisPts[1].clone().sub(thisPts[0])
        let thisAngle = Math.acos(thisDir.clone().normalize().x)
        // console.log(thisPts, thisDir, thisAngle)

        let thisCopy = copyPts(thisPts)
        let otherCopy = copyPts(otherPts)
        let origin = new THREE.Vector2(0, 0)
        for (let pt of thisCopy) {

            pt.sub(otherPts[0]);
            pt.rotateAround(origin, otherAngle);
            pt.add(otherPts[0]);
        }
        for (let pt of otherCopy)
            pt.sub(otherPts[0]).rotateAround(origin, otherAngle).add(otherPts[0])
        let thisPtsInOther = inBox(minPt(otherCopy), thisCopy, maxPt(otherCopy))
        console.log(thisCopy)
        console.log(otherCopy)


        thisCopy = copyPts(thisPts)
        otherCopy = copyPts(otherPts)
        for (let pt of thisCopy)
            pt.rotateAround(thisPts[0], thisAngle)
        for (let pt of otherCopy)
            pt.rotateAround(thisPts[0], thisAngle)
        let otherPtsInThis = inBox(minPt(thisCopy), otherCopy, minPt(thisCopy))
        // console.log(otherCopy)

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
                console.log(se, sq, se.intersect(sq, false))
                if (se.intersect(sq, false)) {
                    return true
                }
            }
        }
        return false
    }
}


export {
    inBox, minPt, maxPt, Point,
    Seg2D, AnyRect2D
}
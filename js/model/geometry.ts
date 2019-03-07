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

declare type Point = THREE.Vector2;

class Seg2D {
    constructor(
        readonly from: THREE.Vector2,
        readonly to: THREE.Vector2
    ) { }
    intersect(other: Seg2D): boolean {
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
            return (<any>ac).cross(ab) * (<any>ad).cross(ab) <= 0 &&
                (<any>ca).cross(cd) * (<any>cb).cross(cd) <= 0
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
    readonly bbox2d: THREE.Box2
    constructor(private readonly pts: THREE.Vector2[]) {
        this.bbox2d = new THREE.Box2(minPt(pts), maxPt(pts))
    }


    intersect(other: AnyRect2D): boolean {
        const recBox = new THREE.Box2(minPt(other.pts), maxPt(other.pts))
        if (!recBox.intersectsBox(this.bbox2d)) return false
        //assume road width is integer
        let recDir = other.pts[1].clone().sub(other.pts[0])
        let roadAngle = Math.acos(recDir.normalize().x)
        let origin = new THREE.Vector2(0, 0)
        let housePts = this.pts
        for (let pt of housePts)
            pt.rotateAround(origin, -roadAngle)
        for (let pt of other.pts)
            pt.rotateAround(origin, -roadAngle)
        let housePtsInRec = inBox(other.pts[3], housePts, other.pts[1])
        let houseRoadDir = housePts[1].clone().sub(housePts[0])
        let houseRoadAngle = Math.acos(houseRoadDir.x)
        for (let pt of housePts)
            pt.rotateAround(origin, roadAngle - houseRoadAngle)
        for (let pt of other.pts)
            pt.rotateAround(origin, roadAngle - houseRoadAngle)
        let roadPtsInHouse = inBox(this.bbox2d.min, other.pts, this.bbox2d.max)
        //case 1
        if (housePtsInRec || roadPtsInHouse) return true
        //case 2
        let roadAC = new Seg2D(other.pts[0], other.pts[2])
        let roadBD = new Seg2D(other.pts[1], other.pts[3])
        let houseAC = new Seg2D(other.pts[0], other.pts[2])
        let houseBD = new Seg2D(other.pts[1], other.pts[3])

        return roadAC.intersect(houseAC) ||
            roadAC.intersect(houseBD) ||
            roadBD.intersect(houseAC) ||
            roadBD.intersect(houseBD)
    }
}


export {
    inBox, minPt, maxPt, Point,
    Seg2D, AnyRect2D
}
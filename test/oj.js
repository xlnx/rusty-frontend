

// import * as THREE from "three"
// import { Seg2D } from "../js/model/geometry";

// new Seg2D(new THREE.Vector2(1, 1), new THREE.Vector2(2, 2))


const eps = 1e-2
function cmp(a, b) {
    const val = b - a
    return Math.abs(val) < eps ? 0 : val > 0 ? 1 : -1
}

function minPt(pts) {
    let pt = new Vector2(pts[0].x, pts[1].y)
    for (let p of pts) {
        pt.x = Math.min(pt.x, p.x)
        pt.y = Math.min(pt.y, p.y)
    }
    return pt
}

function maxPt(pts) {
    let pt = new Vector2(pts[0].x, pts[1].y)
    for (let p of pts) {
        pt.x = Math.max(pt.x, p.x)
        pt.y = Math.max(pt.y, p.y)
    }
    return pt
}

class Vector2 {
    constructor(
        x,
        y
    ) {
        this.x = x
        this.y = y
    }

    cross(other) {
        return this.x * other.y - this.y * other.x
    }
    sub(other) {
        return new Vector2(other.x - this.x, other.y - this.y)
    }
    length() {
        return Math.sqrt(
            this.x * this.x + this.y * this.y
        )
    }
}


class Seg2D {
    constructor(
        from,
        to
    ) {
        this.from = from
        this.to = to
    }

    intersect(other, flag = true) {
        //1.rapid judge: rectangle coincide
        let a = this.from
        let b = this.to
        let c = other.from
        let d = other.to
        const [e, f] = [minPt([a, b]), maxPt([a, b])]
        const [g, h] = [minPt([c, d]), maxPt([c, d])]
        // if (new THREE.Box2(e, f).intersectsBox(new THREE.Box2(g, h)))
        if (
            Math.min(a.x, b.x) <= Math.max(c.x, d.x) &&
            Math.max(a.x, b.x) >= Math.min(c.x, d.x) &&
            Math.min(a.y, b.y) <= Math.max(c.y, d.y) &&
            Math.max(a.y, b.y) >= Math.min(c.y, d.y)
        ) {
            //possibly line conincide
            let ab = b.sub(a)
            let ac = c.sub(a)
            let ad = d.sub(a)
            let ca = a.sub(c)
            let cd = d.sub(c)
            let cb = b.sub(c)
            //2.cross standing experiment
            if (flag) {
                return cmp(ac.cross(ab) * ad.cross(ab), 0) >= 0 &&
                    cmp(ca.cross(cd) * cb.cross(cd), 0) >= 0
            }
            else return cmp(ac.cross(ab) * ad.cross(ab), 0) > 0 &&
                cmp(ca.cross(cd) * cb.cross(cd), 0) > 0
        }
        return false
    }
    distance(pt) {
        let ab = this.to.sub(this.from)
        let ac = pt.sub(this.from)
        return Math.abs(ab.cross(ac)) / ab.length()
    }

}

const s1 = new Seg2D(new Vector2(0, 0), new Vector2(1, 1))
const s2 = new Seg2D(new Vector2(1, 1), new Vector2(2, 2))


let stdin = "";

process.stdin.resume()
process.stdin.setEncoding('utf8')

process.stdin.on('data', data => { stdin += data })

process.stdin.on('end', () => {
    let input = stdin.split(/\s+/).map(e => Number.parseInt(e))

    let n = input[0]
    let other = input.slice(1)

    for (let i = 0; i != n; ++i) {
        const [a, b, c, d, e, f, g, h] = other
        const [x, y] = [
            new Seg2D(
                new Vector2(a, b),
                new Vector2(c, d)
            ),
            new Seg2D(
                new Vector2(e, f),
                new Vector2(g, h)
            )
        ]
        console.log(x.intersect(y) ? "Yes" : "No")
        other = other.slice(8)
    }
})


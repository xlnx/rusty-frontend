import { test_json } from "../../pkg/crate_bg";

class Road {
  houses: { house: House, offset: number }[]
  // model: any
  constructor(readonly from: Point, readonly to: Point) {
    this.houses = new Array()
  }
  crossRoad(road: Road): boolean {
    //1.rapid judge: rectangle coincide
    let a = this.from
    let b = this.to
    let c = road.from
    let d = road.to
    if (
      Math.min(a.x, b.x) <= Math.max(c.x, d.x) &&
      Math.max(a.x, b.x) >= Math.min(c.x, d.x) &&
      Math.min(a.y, b.y) <= Math.max(c.y, d.y) &&
      Math.max(a.y, b.y) >= Math.min(c.y, d.y)
    ) {
      //possibly line conincide
      let ab = b.minus(a)
      let ac = c.minus(a)
      let ad = d.minus(a)
      let ca = a.minus(c)
      let cd = d.minus(c)
      let cb = b.minus(c)
      //2.cross standing experiment
      if (
        ac.cross(ab) * ad.cross(ab) <= 0 &&
        ca.cross(cd) * cb.cross(cd) <= 0
      ) return true
    }
    return false
  }
  distOfPoint(pt: Point): number {
    let ab = this.to.minus(this.from)
    let ac = pt.minus(this.from)
    return Math.abs(ab.cross(ac)) / ab.norm()
  }
}

// class QuadTree<T> {
//   static maxDepth = 8
//   isLeaf: boolean
//   nw: QuadTree<T> | null
//   ne: QuadTree<T> | null
//   sw: QuadTree<T> | null
//   se: QuadTree<T> | null
//   objects: T[]
//   constructor(
//     readonly depth: number,
//     readonly center: Point,
//     readonly radius: number,
//     readonly objDist: function(Point, T): number,
//     //an obj should be in the node, but not actually be
//     readonly objShouldBeInNode: function(T): boolean,
//     //an obj is indeed in the node
//     readonly objIsInNode: function(T): boolean
//   ) {
//     this.objects = new Array()
//     if (this.depth < QuadTree.maxDepth) {
//       let newRadius = this.radius / 2
//       let newDepth = this.depth + 1
//       this.nw = new QuadTree<T>(newDepth, this.center.plus(new Point({ x: -newRadius, y: +newRadius })), newRadius, this.objDist, this.objShouldBeInNode, this.objIsInNode)
//       this.ne = new QuadTree<T>(newDepth, this.center.plus(new Point({ x: +newRadius, y: +newRadius })), newRadius, this.objDist, this.objShouldBeInNode, this.objIsInNode)
//       this.se = new QuadTree<T>(newDepth, this.center.plus(new Point({ x: +newRadius, y: -newRadius })), newRadius, this.objDist, this.objShouldBeInNode, this.objIsInNode)
//       this.sw = new QuadTree<T>(newDepth, this.center.plus(new Point({ x: -newRadius, y: -newRadius })), newRadius, this.objDist, this.objShouldBeInNode, this.objIsInNode)
//       this.isLeaf = false
//     }
//     else {
//       this.isLeaf = true
//       this.nw = null
//       this.ne = null
//       this.se = null
//       this.sw = null
//     }
//   }
//   getNearestObj(pt: Point): T {
//     let minDist = +Infinity
//     let res = this.objects[0]
//     this.objects.forEach((t) => {
//       let dist = this.objDist(pt, t);
//       if (dist < minDist) {
//         minDist = dist
//         res = t
//       }
//     })
//     return res
//   }
// }
// type QuadTree<T> = Array<T>

class Basemap {
  edge = new Map<Point, Road[]>()
  houseTree = new Array<House>()
  roadTree = new Array<Road>()

  addRoad(from: Point, to: Point): Road[] {
    let res = new Array<Road>()
    let newRoad = new Road(from, to)
    let isSegmented = false
    for (let road of this.roadTree) {
      if (road.crossRoad(newRoad)) {
        let c = road.from
        let d = road.to
        let cd = d.minus(c)
        let dist1 = newRoad.distOfPoint(c)
        let dist2 = newRoad.distOfPoint(d)
        let t = dist1 / (dist1 + dist2)
        let crossPt = new Point(c.x + cd.x * t, c.y + cd.y * t)
        //if the cross point is not C or D
        if (!crossPt.equals(c) && !crossPt.equals(d)) {
          this.removeRoad(road)
          this.pushRoad(new Road(c, crossPt))
          this.pushRoad(new Road(crossPt, d))
        }
        //otherwise, if cross point is C or D, nothing to do with line CD
        res.concat(this.addRoad(from, crossPt))
        res.concat(this.addRoad(crossPt, to))
        isSegmented = true
        break
      }
    }
    if (!isSegmented) {
      res.push(newRoad)
      this.pushRoad(newRoad)
    }
    return res
  }
  private pushRoad(road: Road) {
    if (this.edge.has(road.from)) {
      this.edge.get(road.from)!.push(road)
    } else {
      let list = new Array()
      list[0] = road
      this.edge.set(road.from, list)
    }
    if (this.edge.has(road.to)) {
      this.edge.get(road.to)!.push(road)
    }
    else {
      let list = new Array()
      list[0] = road
      this.edge.set(road.to, list)
    }
    this.roadTree.push(road)
  }
  addHouse(pt: Point, type: HousePrototype): boolean {
    let newHouse = new House(type, pt.x, pt.y)
    this.houseTree.push(newHouse)
  }
  alignRoad(from: Point, to: Point): boolean {

  }
  alignHouse(pt: Point, house: HousePrototype): { center: Point, angle: number, valid: boolean } {

  }
  // selectHouse(pt: Point): House | null
  // selectRoad(pt: Point): Road | null
  removeHouse(house: House): void {
    //remove house in tree
    for (let i = 0; i < this.houseTree.length; ++i) {
      let h = this.houseTree[i]
      if (h == house) {
        this.houseTree.splice(i, 1)
        break
      }
    }
  }
  removeRoad(road: Road): void {
    //remove road in tree
    for (let i = 0; i < this.roadTree.length; ++i) {
      let r = this.roadTree[i]
      if (r.from == road.from && r.to == road.to) {
        this.roadTree.splice(i, 1)
        break
      }
    }
    //remove road in map
    for (let i = 0; i < this.edge.get(road.from)!.length; ++i) {
      let r = this.edge.get(road.from)![i]
      if (r.to == road.to) {
        this.edge.get(road.from)!.splice(i, 1)
        break
      }
    }
    for (let i = 0; i < this.edge.get(road.to)!.length; ++i) {
      let r = this.edge.get(road.to)![i]
      if (r.from == road.from) {
        this.edge.get(road.to)!.splice(i, 1)
        break
      }
    }
  }
}

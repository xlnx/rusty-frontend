import * as THREE from "three"
import Building from "../object/building";
import BuildingPrototype from "../asset/building";
import BuildingMathImpl from "./building";
import { RoadWidth, RoadLikeObject, BuildingLikeObject } from "./def";
import { Point, AnyRect2D } from "./geometry";
import RoadMathImpl from "./road";

type Restype = {
  road: RoadLikeObject,
  offset: number,
  center: THREE.Vector2,
  angle: number,
  valid: boolean
} | undefined

class Basemap {
  edge = new Map<Point, RoadMathImpl[]>()
  buildingTree: BuildingMathImpl[] = []
  roadTree: RoadMathImpl[] = []

  constructor(private readonly RoadType: new (u: THREE.Vector2, v: THREE.Vector2) => RoadLikeObject) { }

  addRoad(from: Point, to: Point): RoadLikeObject[] {
    let res: RoadLikeObject[] = []
    let obj = new this.RoadType(from, to)
    let { mathImpl: newRoad } = obj
    let isSegmented = false
    for (let road of this.roadTree) {
      if (road.seg.intersect(newRoad.seg)) {
        let c = road.from
        let d = road.to
        let cd = d.clone().sub(c)
        let dist1 = newRoad.seg.distance(c)
        let dist2 = newRoad.seg.distance(d)
        let t = dist1 / (dist1 + dist2)
        if (isNaN(t)) continue
        let crossPt = c.clone().add(cd.clone().multiplyScalar(t))
        // let tes = { from: c, to: d, crossPoint: crossPt }
        // console.log(tes)

        //if the cross point is not C or D
        if (!crossPt.equals(c) && !crossPt.equals(d)) {
          this.removeRoad(road.road)
          this.pushRoad(new this.RoadType(c, crossPt).mathImpl)
          this.pushRoad(new this.RoadType(crossPt, d).mathImpl)
        }
        //otherwise, if cross point is C or D, nothing to do with line CD

        //if new this.RoadType is not segmented
        if (crossPt.equals(from) || crossPt.equals(to)) continue
        res = res.concat(this.addRoad(from, crossPt))
        res = res.concat(this.addRoad(crossPt, to))
        isSegmented = true
        break
      }
    }
    if (!isSegmented) {
      res.push(obj)
      this.pushRoad(newRoad)
    }
    return res
  }

  private pushRoad(road: RoadMathImpl) {
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

  addBuilding(building: BuildingLikeObject) {
    this.buildingTree.push(building.mathImpl)
  }

  alignRoad(road: RoadLikeObject): boolean {
    const { from, to } = road.mathImpl
    let newRoad = new this.RoadType(from, to)

    //detect building cross
    for (let building of this.buildingTree) {
      if (building.intersectRoad(newRoad.mathImpl))
        return false
    }

    return true
  }
  // alignBuilding(pt: Point, ind: BuildingLikeObject): Restype {

  //   const nearRoad = this.getNearRoad(pt)
  //   if (nearRoad) {
  //     const { mathImpl: road } = nearRoad
  //     if (road.seg.distance(pt) > ind.placeholder.height) return

  //     let AB = pt.clone().sub(road.from)
  //     let AC = road.to.clone().sub(road.from).normalize()
  //     let offset = AC.dot(AB)

  //     // let newBuilding = new BuildingMathImpl(proto, road, offset)
  //     //lacking rotate angle computing
  //     // res.angle = newBuilding.angle!
  //     let rect = new AnyRect2D()

  //     let res = <Restype>{
  //       road: obj,
  //       offset: offset,
  //       center:,
  //       angle:,
  //       valid: true
  //     }

  //     //detect building cross
  //     for (let building of this.buildingTree) {
  //       if (building.rect.intersect(rect)) {
  //         res.valid = false
  //         return res
  //       }
  //     }

  //     //detect road cross
  //     for (let road of this.roadTree) {
  //       if (rect.intersect(road.rect)) {
  //         res.valid = false
  //         return res
  //       }
  //     }
  //     return res
  //   }
  // }

  // selectBuilding(pt: Point): Building | null
  removeBuilding(obj: BuildingLikeObject): void {
    const building = obj.mathImpl
    //remove Building in tree
    for (let i = 0; i < this.buildingTree.length; ++i) {
      let h = this.buildingTree[i]
      if (h == building) {
        this.buildingTree.splice(i, 1)
        break
      }
    }
  }
  removeRoad(obj: RoadLikeObject): void {
    const road = obj.mathImpl
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

  selectRoad(pt: Point): RoadLikeObject | undefined {
    let res = this.getNearRoad(pt)
    if (res) {
      const road = res.mathImpl
      if (road.seg.distance(pt) <= RoadWidth) {
        return res
      }
    }
  }
  getNearRoad(pt: Point): RoadLikeObject | undefined {
    if (this.roadTree.length) {
      let res = this.roadTree[0]
      let minDist = res.seg.distance(pt)
      for (let road of this.roadTree)
        if (road.seg.distance(pt) < minDist) {
          minDist = road.seg.distance(pt)
          res = road
        }
      return res.road
    }
  }
}

export {
  Basemap
}
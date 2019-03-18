import * as THREE from "three"
import { BuildingPrototype } from "../asset/building";
import BuildingMathImpl from "./building";
import { RoadLikeObject, BuildingLikeObject, mapWidth, mapHeight, maxBuildings, maxRoads } from "./def";
import { Point, AnyRect2D } from "./geometry";
import RoadMathImpl from "./road";
import * as QuadTree from "quadtree-lib"

type Restype = {
  road: RoadLikeObject,
  offset: number,
  center: THREE.Vector2,
  angle: number,
  valid: boolean
} | undefined

class Basemap {
  edge = new Map<Point, RoadMathImpl[]>()
  buildingTree: QuadTree<Quadtree.QuadtreeItem> = <any>null
  roadTree: QuadTree<Quadtree.QuadtreeItem> = <any>null

  constructor(private readonly RoadType:
    new (w: number, u: THREE.Vector2, v: THREE.Vector2) => RoadLikeObject) {
    this.buildingTree = new QuadTree({
      width: mapWidth,
      height: mapHeight,
      maxElements: maxBuildings
    })
    this.roadTree = new QuadTree({
      width: mapWidth,
      height: mapHeight,
      maxElements: maxRoads
    })
  }

  addRoad(width: number, from: Point, to: Point): RoadLikeObject[] {
    let res: RoadLikeObject[] = []
    let obj = new this.RoadType(width, from, to)
    let { mathImpl: newRoad } = obj
    let segPts: Point[] = []
    let tempRoad: RoadMathImpl[] = []
    let treeItems = this.roadTree.colliding(newRoad.quadtreeItem)
    for (let item of treeItems) {
      let road = item.obj
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

        //if the cross point is not C or D
        if (!crossPt.equals(c) && !crossPt.equals(d)) {
          this.removeRoad(road.road)
          tempRoad.push(new this.RoadType(road.road.width, c, crossPt).mathImpl)
          tempRoad.push(new this.RoadType(road.road.width, crossPt, d).mathImpl)
        }
        //otherwise, if cross point is C or D, nothing to do with line CD

        //if new this.RoadType is not segmented
        if (crossPt.equals(from) || crossPt.equals(to)) continue
        segPts.push(crossPt)
      }
    }

    segPts.push(to)
    let From = from
    for (let pt of segPts) {
      let newRoad = new this.RoadType(width, From, pt).mathImpl
      this.pushRoad(newRoad)
      res.push(newRoad.road)
      From = pt
    }
    for (let road of tempRoad) {
      this.pushRoad(road)
    }
    return res
  }

  private pushRoad(road: RoadMathImpl) {
    if (this.edge.has(road.from)) {
      this.edge.get(road.from)!.push(road)
    } else {
      this.edge.set(road.from, [road])
    }
    if (this.edge.has(road.to)) {
      this.edge.get(road.to)!.push(road)
    }
    else {
      this.edge.set(road.to, [road])
    }
    this.roadTree.push(road.quadtreeItem)
  }

  addBuilding(building: BuildingLikeObject) {
    this.buildingTree.push(building.mathImpl.quadTreeItem)
  }

  alignRoad(road: RoadLikeObject): boolean {

    //detect building cross
    let intersectBuilding = this.buildingTree.colliding(road.mathImpl.quadtreeItem)
    for (let item of intersectBuilding) {
      let building = item.obj
      if (building.intersectRoad(road.mathImpl))
        return false
    }
    return true
  }

  alignBuilding(pt: Point, placeholder: THREE.Vector2): Restype {

    const nearRoad = this.getNearRoad(pt)
    if (nearRoad) {
      const { mathImpl: road } = nearRoad
      if (road.seg.distance(pt) > placeholder.height) return

      let AB = pt.clone().sub(road.from)
      let AC = road.to.clone().sub(road.from)
      let roadLength = AC.length()
      if (roadLength < placeholder.width) return
      roadLength -= placeholder.width
      AC.normalize()
      let origin = new THREE.Vector2(0, 0)
      let offset = Math.round(AC.dot(AB) - placeholder.width / 2)
      offset = offset < 0 ? 0 : offset > roadLength ? roadLength : offset
      let x = (<any>AB).cross(AC) < 0 ? 1 : -1//1: left, -1:right
      let normDir = AC.clone().rotateAround(origin, Math.PI / 2 * x)

      let angle = Math.acos(new THREE.Vector2(0, -1).dot(origin.clone().sub(normDir)))
        * (new THREE.Vector2(0, -1).dot(AC.clone()) > 0 ? 1 : -1) * -x
      let center = road.from.clone()
        .add(AC.clone().multiplyScalar(offset + placeholder.width / 2))
        .add(normDir.clone().multiplyScalar(placeholder.height / 2 + road.road.width / 2))
      normDir.multiplyScalar(x)
      let rect = new AnyRect2D([
        center.clone().add(normDir.clone().multiplyScalar(placeholder.height / 2))
          .add(AC.clone().multiplyScalar(placeholder.width / 2)),
        center.clone().sub(normDir.clone().multiplyScalar(placeholder.height / 2))
          .add(AC.clone().multiplyScalar(placeholder.width / 2)),
        center.clone().sub(normDir.clone().multiplyScalar(placeholder.height / 2))
          .sub(AC.clone().multiplyScalar(placeholder.width / 2)),
        center.clone().add(normDir.clone().multiplyScalar(placeholder.height / 2))
          .sub(AC.clone().multiplyScalar(placeholder.width / 2)),
      ])

      let res = <Restype>{
        road: nearRoad,
        offset: offset,
        center: center,
        angle: angle,
        valid: true
      }

      let rectItem = rect.treeItem()
      //detect building cross
      let intersectBuilding = this.buildingTree.colliding(rectItem)
      for (let item of intersectBuilding) {
        let building = item.obj
        if (building.rect.intersect(rect)) {
          res!.valid = false
          return res
        }
      }

      //detect road cross
      let intersectRoad = this.roadTree.colliding(rectItem)
      for (let item of intersectRoad) {
        let road = item.obj
        if (rect.intersect(road.rect)) {
          res!.valid = false
          return res
        }
      }
      return res
    }
  }

  // selectBuilding(pt: Point): Building | null
  removeBuilding(obj: BuildingLikeObject): void {
    const building = obj.mathImpl
    //remove Building in tree
    this.buildingTree.remove(obj.mathImpl.quadTreeItem)
  }
  removeRoad(obj: RoadLikeObject): void {
    const road = obj.mathImpl
    //remove road in tree
    this.roadTree.remove(obj.mathImpl.quadtreeItem)

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
      if (road.seg.distance(pt) <= road.road.width / 2) {
        return res
      }
    }
  }
  getNearRoad(pt: Point): RoadLikeObject | undefined {
    let res: RoadMathImpl | undefined
    let minDist = Infinity
    this.roadTree.each((item) => {
      let road = item.obj
      if (road.seg.distance(pt) < minDist) {
        const ap = pt.clone().sub(road.seg.from)
        const bp = pt.clone().sub(road.seg.to)
        const ab = road.seg.to.clone().sub(road.seg.from)
        const ba = ab.clone().negate()
        if (ap.dot(ab) > 0 && bp.dot(ba) > 0) {
          minDist = road.seg.distance(pt)
          res = road
        }
      }
    })
    return !!res ? res.road : undefined
  }


}

export {
  Basemap
}
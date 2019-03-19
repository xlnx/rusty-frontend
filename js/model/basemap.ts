import * as THREE from "three"
import { BuildingPrototype } from "../asset/building";
import BasemapBuildingItem from "./buildingItem";
import { mapWidth, mapHeight, maxBuildings, maxRoads, QuadTreeItem } from "./def";
import { Point, AnyRect2D, cmp } from "./geometry";
import BasemapRoadItem from "./roadItem";
import * as QuadTree from "quadtree-lib"


type Restype<R> = {
  road: BasemapRoadItem<R>,
  offset: number,
  center: THREE.Vector2,
  angle: number,
  valid: boolean
} | undefined

class Basemap<R, B> {
  roadID = new Map<BasemapRoadItem<R>, number>()
  IDroad = new Map<number, BasemapRoadItem<R>>()
  static count = 0
  private readonly edge = new Map<Point, BasemapRoadItem<R>[]>()
  private readonly buildingTree:
    QuadTree<QuadTreeItem<BasemapBuildingItem<B>>> = new QuadTree({
      width: mapWidth,
      height: mapHeight,
      maxElements: maxBuildings
    })
  private readonly roadTree:
    QuadTree<QuadTreeItem<BasemapRoadItem<R>>> = new QuadTree({
      width: mapWidth,
      height: mapHeight,
      maxElements: maxRoads
    })


  addRoad(width: number, from: Point, to: Point): { added: BasemapRoadItem<R>[], removed: BasemapRoadItem<R>[] } {
    let res = {
      added: <BasemapRoadItem<R>[]>[],
      removed: <BasemapRoadItem<R>[]>[]
    }
    let newRoad = new BasemapRoadItem<R>(width, from, to)
    let segPts: Point[] = []
    let tempRoad: BasemapRoadItem<R>[] = []
    let treeItems = this.roadTree.colliding(newRoad.quadTreeItem)

    // let treeItems: any[] = []
    // this.roadTree.each(e => treeItems.push(e))

    for (let item of treeItems) {
      let road = item.obj!
      if (road.seg.intersect(newRoad.seg)) {
        let c = road.from
        let d = road.to
        let cd = d.clone().sub(c)
        let dist1 = newRoad.seg.distance(c)
        let dist2 = newRoad.seg.distance(d)
        let t = dist1 / (dist1 + dist2)
        if (isNaN(t)) {
          console.log("isNaN")
          continue
        }
        let crossPt = c.clone().add(cd.clone().multiplyScalar(t))
        // console.log(Basemap.count)
        // console.log(crossPt)
        // let tes = { from: c, to: d, crossPoint: crossPt }

        //if the cross point is not C or D
        if (!crossPt.equals(c) && !crossPt.equals(d)) {
          // this.removeRoad(road)
          res.removed.push(road)
          tempRoad.push(new BasemapRoadItem<R>(road.width, c, crossPt))
          tempRoad.push(new BasemapRoadItem<R>(road.width, crossPt, d))
        }
        //otherwise, if cross point is C or D, nothing to do with line CD

        //if new this.RoadType is not segmented
        if (crossPt.equals(from) || crossPt.equals(to)) continue
        segPts.push(crossPt)
      }
    }

    //remove segmented roads
    for (let road of res.removed)
      this.removeRoad(road)

    segPts.push(to)
    //sort pts by distance to fromPt
    segPts.sort((a, b): number => {
      return a.clone().sub(from).length() - b.clone().sub(from).length()
    })
    let From = from
    for (let pt of segPts) {
      let newRoad = new BasemapRoadItem<R>(width, From, pt)
      this.pushRoad(newRoad)
      res.added.push(newRoad)
      From = pt
    }
    for (let road of tempRoad) {
      this.pushRoad(road)
      res.added.push(road)
    }
    return res
  }

  private pushRoad(road: BasemapRoadItem<R>) {
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
    this.roadTree.push(road.quadTreeItem, true)

    this.roadID.set(road, Basemap.count)
    this.IDroad.set(Basemap.count, road)
    Basemap.count++
  }

  addBuilding(building: BasemapBuildingItem<B>) {
    this.buildingTree.push(building.quadTreeItem)
  }

  alignRoad(road: BasemapRoadItem<R>): boolean {

    //detect building cross
    let intersectBuilding = this.buildingTree.colliding(road.quadTreeItem)
    for (let item of intersectBuilding) {
      let building = item.obj!
      if (building.intersectRoad(road))
        return false
    }
    return true
  }

  alignBuilding(pt: Point, placeholder: THREE.Vector2): Restype<R> {

    const road = this.getNearRoad(pt)
    if (road) {
      if (road.seg.distance(pt) > placeholder.height) return

      let AB = pt.clone().sub(road.from)
      let AC = road.to.clone().sub(road.from)
      let roadLength = AC.length()
      if (roadLength < placeholder.width) return
      roadLength -= placeholder.width
      AC.normalize()

      let origin = new THREE.Vector2(0, 0)
      let faceDir = new THREE.Vector2(0, -1)

      //1: left, -1:right
      let offsetSign = (<any>AC.clone()).cross(AB) > 0 ? 1 : -1
      let offset = Math.round(AC.dot(AB) - placeholder.width / 2)
      offset = offset < 0 ? 0 : offset > roadLength ? roadLength : offset

      let normDir = AC.clone().rotateAround(origin, Math.PI / 2 * offsetSign)
      let negNormDir = origin.clone().sub(normDir)

      // let angle = Math.acos(faceDir.clone().dot(negNormDir)) * -offsetSign
      let angleSign = (<any>negNormDir.clone()).cross(faceDir) > 0 ? -1 : 1
      let angle = Math.acos(negNormDir.clone().dot(faceDir)) * angleSign
      let center = road.from.clone()
        .add(AC.clone().multiplyScalar(offset + placeholder.width / 2))
        .add(normDir.clone().multiplyScalar(placeholder.height / 2 + road.width / 2))

      let rect = new AnyRect2D([
        center.clone().add(normDir.clone().multiplyScalar(placeholder.height / 2))
          .add(AC.clone().multiplyScalar(placeholder.width / 2)),
        center.clone().add(negNormDir.clone().multiplyScalar(placeholder.height / 2))
          .add(AC.clone().multiplyScalar(placeholder.width / 2)),
        center.clone().add(negNormDir.clone().multiplyScalar(placeholder.height / 2))
          .sub(AC.clone().multiplyScalar(placeholder.width / 2)),
        center.clone().add(normDir.clone().multiplyScalar(placeholder.height / 2))
          .sub(AC.clone().multiplyScalar(placeholder.width / 2)),
      ])

      offset *= offsetSign
      let res = <Restype<R>>{
        road: road,
        offset: offset,
        center: center,
        angle: angle,
        valid: true
      }

      let rectItem = rect.treeItem()
      //detect building cross
      let intersectBuilding = this.buildingTree.colliding(rectItem)
      for (let item of intersectBuilding) {
        let building = item.obj!
        if (building.rect.intersect(rect)) {
          res!.valid = false
          return res
        }
      }

      //detect road cross
      let intersectRoad = this.roadTree.colliding(rectItem)
      for (let item of intersectRoad) {
        let r = item.obj!
        if (road == r) continue
        if (rect.intersect(r.rect)) {
          res!.valid = false
          // console.log(this.roadID.get(road))
          return res
        }
      }
      return res
    }
  }

  // selectBuilding(pt: Point): Building | null
  removeBuilding(obj: BasemapBuildingItem<B>): BasemapBuildingItem<B> {
    const building = obj
    //remove Building in tree
    this.buildingTree.remove(obj.quadTreeItem)
    return obj
  }
  removeRoad(obj: BasemapRoadItem<R>): BasemapRoadItem<R> {
    const road = obj!
    //remove road in tree
    this.roadTree.remove(obj.quadTreeItem)

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
    return obj
  }

  selectRoad(pt: Point): BasemapRoadItem<R> | undefined {
    let res = this.getNearRoad(pt)
    if (res &&
      cmp(res.seg.distance(pt), res.width / 2) <= 0)
      return res
  }

  getNearRoad(pt: Point): BasemapRoadItem<R> | undefined {
    let res: BasemapRoadItem<R> | undefined
    let minDist = Infinity
    this.roadTree.each((item) => {
      let road = item.obj!
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
    return res
  }

}

export {
  Basemap
}
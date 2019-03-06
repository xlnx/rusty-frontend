// import Building from "../asset/building";
// import { Point, RoadWidth } from "./def";
// import * as THREE from "three"

// class Road {
//   buildings: { building: Building }[]
//   public readonly bbox?: THREE.Box2

//   constructor(readonly from: Point, readonly to: Point) {
//     this.buildings = new Array()

//   }
//   crossRoad(road: Road): boolean {
//     //1.rapid judge: rectangle coincide
//     let a = this.from
//     let b = this.to
//     let c = road.from
//     let d = road.to
//     if (
//       Math.min(a.x, b.x) <= Math.max(c.x, d.x) &&
//       Math.max(a.x, b.x) >= Math.min(c.x, d.x) &&
//       Math.min(a.y, b.y) <= Math.max(c.y, d.y) &&
//       Math.max(a.y, b.y) >= Math.min(c.y, d.y)
//     ) {
//       //possibly line conincide
//       let ab = b.sub(a)
//       let ac = c.sub(a)
//       let ad = d.sub(a)
//       let ca = a.sub(c)
//       let cd = d.sub(c)
//       let cb = b.sub(c)
//       //2.cross standing experiment
//       if (
//         (<any>ac).cross(ab) * (<any>ad).cross(ab) <= 0 &&
//         (<any>ca).cross(cd) * (<any>cb).cross(cd) <= 0
//       ) return true
//     }
//     return false
//   }

//   distOfPoint(pt: Point): number {
//     let ab = this.to.sub(this.from)
//     let ac = pt.sub(this.from)
//     return Math.abs((<any>ab).cross(ac)) / ab.length()
//   }

//   rec(): Point[] {
//     let roadDir = this.to.clone().sub(this.from)
//     let roadNormDir = roadDir.clone().rotateAround(new THREE.Vector2(0, 0), Math.PI / 2).normalize()
//     let roadPts = new Array<THREE.Vector2>()
//     roadPts[0] = this.from.clone().add(roadNormDir.clone().multiplyScalar(RoadWidth))
//     roadPts[1] = roadPts[0].clone().add(roadDir)
//     roadPts[3] = this.from.clone().sub(roadNormDir.clone().multiplyScalar(-RoadWidth))
//     roadPts[2] = roadPts[3].clone().add(roadDir)
//     return roadPts
//   }
// }

// class Basemap {
//   edge = new Map<Point, Road[]>()
//   buildingTree = new Array<Building>()
//   roadTree = new Array<Road>()

//   addRoad(from: Point, to: Point): Road[] {
//     let res = new Array<Road>()
//     let newRoad = new Road(from, to)
//     let isSegmented = false
//     for (let road of this.roadTree) {
//       if (road.crossRoad(newRoad)) {
//         let c = road.from
//         let d = road.to
//         let cd = d.sub(c)
//         let dist1 = newRoad.distOfPoint(c)
//         let dist2 = newRoad.distOfPoint(d)
//         let t = dist1 / (dist1 + dist2)
//         let crossPt = new THREE.Vector2(c.x + cd.x * t, c.y + cd.y * t)
//         //if the cross point is not C or D
//         if (!crossPt.equals(c) && !crossPt.equals(d)) {
//           this.removeRoad(road)
//           this.pushRoad(new Road(c, crossPt))
//           this.pushRoad(new Road(crossPt, d))
//         }
//         //otherwise, if cross point is C or D, nothing to do with line CD
//         res.concat(this.addRoad(from, crossPt))
//         res.concat(this.addRoad(crossPt, to))
//         isSegmented = true
//         break
//       }
//     }
//     if (!isSegmented) {
//       res.push(newRoad)
//       this.pushRoad(newRoad)
//     }
//     return res
//   }
//   private pushRoad(road: Road) {
//     if (this.edge.has(road.from)) {
//       this.edge.get(road.from)!.push(road)
//     } else {
//       let list = new Array()
//       list[0] = road
//       this.edge.set(road.from, list)
//     }
//     if (this.edge.has(road.to)) {
//       this.edge.get(road.to)!.push(road)
//     }
//     else {
//       let list = new Array()
//       list[0] = road
//       this.edge.set(road.to, list)
//     }
//     this.roadTree.push(road)
//   }
//   addBuilding(building: Building): boolean {
//     this.BuildingTree.push(building)
//   }
//   alignRoad(from: Point, to: Point): boolean {

//   }
//   alignBuilding(pt: Point, proto: BuildingPrototype): { center: Point, angle: number, valid: boolean } {
//     let road = this.getNearRoad(pt)
//     let AB = pt.clone().sub(road.from)
//     let AC = road.to.clone().sub(road.from).normalize()
//     let offset = AB.dot(AC)
//     let newBuilding = Building.from(proto, road, offset)
//     let angle =

//       let crossBuilding = false
//     for (let building of this.buildingTree) {
//       if (building.crossBuilding(newBuilding)) return {
//         pt, angle, false
//       }
//     }
//   }

//   // selectBuilding(pt: Point): Building | null
//   // selectRoad(pt: Point): Road | null
//   removeBuilding(building: Building): void {
//     //remove Building in tree
//     for (let i = 0; i < this.buildingTree.length; ++i) {
//       let h = this.buildingTree[i]
//       if (h == building) {
//         this.buildingTree.splice(i, 1)
//         break
//       }
//     }
//   }
//   removeRoad(road: Road): void {
//     //remove road in tree
//     for (let i = 0; i < this.roadTree.length; ++i) {
//       let r = this.roadTree[i]
//       if (r.from == road.from && r.to == road.to) {
//         this.roadTree.splice(i, 1)
//         break
//       }
//     }
//     //remove road in map
//     for (let i = 0; i < this.edge.get(road.from)!.length; ++i) {
//       let r = this.edge.get(road.from)![i]
//       if (r.to == road.to) {
//         this.edge.get(road.from)!.splice(i, 1)
//         break
//       }
//     }
//     for (let i = 0; i < this.edge.get(road.to)!.length; ++i) {
//       let r = this.edge.get(road.to)![i]
//       if (r.from == road.from) {
//         this.edge.get(road.to)!.splice(i, 1)
//         break
//       }
//     }
//   }
//   getNearRoad(pt: Point): Road {
//     let res = this.roadTree[0]
//     let minDist = res.distOfPoint(pt)
//     for (let road of this.roadTree)
//       if (road.distOfPoint(pt) < minDist) {
//         minDist = road.distOfPoint(pt)
//         res = road
//       }
//     return res
//   }
// }

// export {
//   Road, Basemap
// }
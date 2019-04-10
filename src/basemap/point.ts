// import * as THREE from 'three'
// import { Object3D, Vector2 } from 'three';

// import { DistUnit, PointRadius } from '../asset/def';
// import { plain2world } from '../object/trans';
// import { Geometry2D, Thing, Variable } from '../wasp';

// import { PointDetectRadius } from './def';


// class PointIndicator extends Thing {
//   private static circleGeo = new THREE.CircleGeometry(
//     PointRadius, 32, 0, Math.PI * 2)
//   private static ringGeo =
//     new THREE.RingGeometry(
//       PointRadius, PointRadius + .1, 32, 0, undefined, Math.PI * 2)

//   private static readonly circleMat = new THREE.MeshBasicMaterial({
//     color: new THREE.Color(1, 0, 0),
//     side: THREE.DoubleSide,
//     opacity: 0.2,
//     transparent: true
//   })
//   private static readonly ringMat = new THREE.MeshBasicMaterial({
//     color: new THREE.Color(1, 0, 0),
//     side: THREE.DoubleSide,
//     opacity: 0.96,
//     transparent: true
//   })
//   private static readonly mouseCircleMat = new THREE.MeshBasicMaterial({
//     color: new THREE.Color(0, 1, 0),
//     side: THREE.DoubleSide,
//     opacity: 0.2,
//     transparent: true
//   })
//   private static readonly mouseRingMat =
//     new THREE.MeshBasicMaterial({
//       color: new THREE.Color(0, 1, 0),
//       side: THREE.DoubleSide,
//       opacity: 0.96,
//       transparent: true
//     })

//   public cricle: Geometry2D
//   public ring: Geometry2D

//   constructor(
//     public readonly coord: Vector2,
//     private readonly mouseMode: boolean = false) {
//     super()

//     if (mouseMode) {
//       this.cricle = new Geometry2D(
//         PointIndicator.circleGeo,
//         PointIndicator.mouseCircleMat)
//       this.ring =
//         new Geometry2D(PointIndicator.ringGeo, PointIndicator.mouseRingMat)
//     }
//     else {
//       this.cricle = new Geometry2D(
//         PointIndicator.circleGeo, PointIndicator.circleMat)
//       this.ring = new Geometry2D(PointIndicator.ringGeo, PointIndicator.ringMat)
//     }

//     this.relocate(coord)
//     // const pt = plain2world(coord)
//     // this.cricle.scale(DistUnit, DistUnit).translate(pt.x, pt.z)
//     // this.ring.scale(DistUnit, DistUnit).translate(pt.x, pt.z)
//     // this.cricle.translate(pt.x, pt.y)
//     // this.ring.translate(pt.x, pt.y)
//     // obj.add(this.cricle.mesh)
//     // obj.add(this.ring.mesh)
//   }

//   relocate(coord: Vector2) {
//     const pt = plain2world(coord)
//     // this.cricle.translate(pt.x, pt.z)
//     // this.ring.translate(pt.x, pt.z)
//     this.cricle.scale(DistUnit, DistUnit).translate(pt.x, pt.z)
//     this.ring.scale(DistUnit, DistUnit).translate(pt.x, pt.z)
//     // this.obj.add(this.cricle.mesh)
//     // this.obj.add(this.ring.mesh)
//   }
// }

// export { PointIndicator }
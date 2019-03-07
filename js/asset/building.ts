import * as THREE from "three"
import ObjAsset from "./obj";
import { AssetPath, DistUnit, ObjectTag } from "./def";
import { RoadWidth, inBox, minPt, maxPt, Point } from "../model/def";
import XHRJson from "./json";

interface TransformStep {
	rotate?: number[],
	translate?: number[]
}

interface BuildingDefination {
	model: string,
	scale?: number[] | number,
	transform?: TransformStep[],
	placeholder: number[]
}

export default class BuildingPrototype {

	readonly frame: THREE.Mesh = <any>null
	readonly object: THREE.Object3D = <any>null
	readonly placeholder: THREE.Vector2 = <any>null

	constructor(proto?: BuildingPrototype) {
		if (proto) {
			this.frame = proto.frame
			this.object = proto.object.clone();
			(<ObjectTag>this.object.userData).object = this
			this.placeholder = proto.placeholder
		}
	}

	private static async doLoadProto(path: string): Promise<BuildingPrototype> {

		return new Promise((resolve, reject) => {
			new XHRJson(path).load().then(json => {
				const prefix = path.substr(0, path.lastIndexOf("/") + 1)
				const def: BuildingDefination = json

				new ObjAsset(prefix + def.model).load().then((obj: THREE.Object3D) => {

					const proto = new BuildingPrototype()

					const self = <any>proto

					{

						self.object = new THREE.Object3D();
						self.object.add(obj);
						self.object.userData = <ObjectTag>{
							root: true,
							type: "building"
						}

						if (def.transform) {
							for (let transform of def.transform) {
								if (transform.rotate) {
									obj.rotateX(transform.rotate[0])
									obj.rotateY(transform.rotate[1])
									obj.rotateZ(transform.rotate[2])
								}
								if (transform.translate) {
									obj.translateX(transform.translate[0])
									obj.translateY(transform.translate[1])
									obj.translateZ(transform.translate[2])
								}
							}
						}
						if (def.scale) {
							if (typeof def.scale == "number") {
								obj.scale.set(def.scale, def.scale, def.scale)
							} else {
								obj.scale.set(def.scale[0], def.scale[1], def.scale[2])
							}
						}
						obj.scale.multiplyScalar(DistUnit)

						const bbox = new THREE.Box3().setFromObject(obj)
						obj.translateY(-bbox.min.y)

						self.placeholder = new THREE.Vector2(
							def.placeholder[0], def.placeholder[1])

						// add indicators
						let plain = new THREE.PlaneGeometry(
							self.placeholder.x * DistUnit, self.placeholder.y * DistUnit)
						plain.rotateX(Math.PI / 2)
						self.object.add(new THREE.Mesh(plain, new THREE.MeshPhongMaterial({
							color: 0x156289,
							side: THREE.DoubleSide,
							displacementScale: 1e-4,
							flatShading: true		// hard edges
						})))

						let h = bbox.max.y - bbox.min.y + 0.05
						let box = new THREE.BoxGeometry(
							def.placeholder[0] * DistUnit, h,
							def.placeholder[0] * DistUnit)
						box.translate(0, h / 2, 0)
						self.frame = new THREE.Mesh(box, new THREE.MeshPhongMaterial({
							color: 0xeeeeee,
							side: THREE.DoubleSide,
							transparent: true,
							opacity: 0.3,
							displacementScale: 1e-4,
							flatShading: true		// hard edges
						}));
						(<ObjectTag>self.frame.userData).discard = true
						self.object.add(self.frame)

					}

					resolve(proto)

				}, reject)
			})
		})
	}

	static async load(path: string[] | string): Promise<(BuildingPrototype | undefined)[]> {
		const paths = typeof path == "string" ? [path] : path
		return new Promise((resolve, reject) => {
			let jobs = paths.length
			const buildings: (BuildingPrototype | undefined)[] = []
			const res = (e: BuildingPrototype, idx: number) => {
				buildings[idx] = e;
				(--jobs == 0) && resolve(buildings)
			}
			const rej = (e: any, idx: number) => {
				buildings[idx] = undefined;
				(--jobs == 0) && resolve(buildings)
			}
			paths.forEach((path: string, idx: number) =>
				BuildingPrototype.doLoadProto(path)
					.then(e => res(e, idx), e => rej(e, idx)))
		})
	}

	// crossRec(rec: THREE.Vector2[]): boolean {
	// 	const recBox = new THREE.Box2(minPt(rec), maxPt(rec))
	// 	if (!recBox.intersectsBox(this.bbox!)) return false
	// 	//assume road width is integer
	// 	let recDir = rec[1].clone().sub(rec[0])
	// 	let roadAngle = Math.acos(recDir.normalize().x)
	// 	let origin = new THREE.Vector2(0, 0)
	// 	let housePts = this.rec()
	// 	for (let pt of housePts)
	// 		pt.rotateAround(origin, -roadAngle)
	// 	for (let pt of rec)
	// 		pt.rotateAround(origin, -roadAngle)
	// 	let housePtsInRec = inBox(rec[3], housePts, rec[1])
	// 	let houseRoadDir = housePts[1].clone().sub(housePts[0])
	// 	let houseRoadAngle = Math.acos(houseRoadDir.x)
	// 	for (let pt of housePts)
	// 		pt.rotateAround(origin, roadAngle - houseRoadAngle)
	// 	for (let pt of rec)
	// 		pt.rotateAround(origin, roadAngle - houseRoadAngle)
	// 	let roadPtsInHouse = this.offset! > 0 ? inBox(housePts[0], rec, housePts[2]) : inBox(housePts[3], rec, housePts[1])
	// 	//case 1
	// 	if (housePtsInRec || roadPtsInHouse) return true
	// 	//case 2
	// 	let roadAC = new Road(rec[0], rec[2])
	// 	let roadBD = new Road(rec[1], rec[3])
	// 	let houseAC = new Road(rec[0], rec[2])
	// 	let houseBD = new Road(rec[1], rec[3])
	// 	if (
	// 		roadAC.crossRoad(houseAC) ||
	// 		roadAC.crossRoad(houseBD) ||
	// 		roadBD.crossRoad(houseAC) ||
	// 		roadBD.crossRoad(houseBD)
	// 	) return true
	// 	return false
	// }

	// crossRoad(road: Road): boolean {
	// 	return this.crossRec(road.rec())
	// }

	// crossBuilding(building: BuildingPrototype): boolean {
	// 	return this.crossRec(building.rec())
	// }

	// rec(): THREE.Vector2[] {
	// 	let houseRoadDir = this.road!.to.clone().sub(this.road!.from).normalize()
	// 	let houseRoadNormDir = houseRoadDir.clone().rotateAround(new THREE.Vector2(0, 0), Math.PI / 2 * this.offset! > 0 ? -1 : 1)
	// 	let housePts = new Array<THREE.Vector2>()
	// 	housePts[0] = this.road!.from.clone().add(houseRoadDir.clone().multiplyScalar(this.offset!)).add(houseRoadNormDir.clone().multiplyScalar(RoadWidth))
	// 	housePts[1] = housePts[0].clone().add(houseRoadDir.clone().multiplyScalar(this.placeholder!.x))
	// 	housePts[2] = housePts[1].clone().add(houseRoadNormDir.clone().multiplyScalar(this.placeholder!.y))
	// 	housePts[3] = housePts[2].clone().sub(houseRoadDir.clone().multiplyScalar(this.placeholder!.x))
	// 	return housePts
	// }
}
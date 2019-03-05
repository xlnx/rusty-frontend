import * as THREE from "three"
import ObjAsset from "./obj";
import { AssetPath, DistUnit, ObjectTag } from "./def";
import { Road } from "../model/basemap";

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

export default class Building {

	private frm?: THREE.Mesh
	private obj?: THREE.Object3D
	private bbox?: THREE.Box2

	get object() { return this.obj }
	get frame() { return this.frm }

	get ok() { return !!this.obj && !!(<ObjectTag>this.obj.userData).object }

	constructor(path?: string, resolve?: (e: Building) => void, reject?: (e: any) => void) {
		if (path) {

			let xhr = new XMLHttpRequest()
			xhr.responseType = "json"
			xhr.onload = e => {
				const prefix = path.substr(0, path.lastIndexOf("/") + 1)
				const def = <BuildingDefination>xhr.response
				new ObjAsset(prefix + def.model).load().then((obj: THREE.Object3D) => {
					this.obj = new THREE.Object3D()
					this.obj.add(obj)
					this.obj.userData = <ObjectTag>{
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

					// add indicators
					let plain = new THREE.PlaneGeometry(
						def.placeholder[0] * DistUnit, def.placeholder[0] * DistUnit)
					plain.rotateX(Math.PI / 2)
					this.obj.add(new THREE.Mesh(plain, new THREE.MeshPhongMaterial({
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
					this.frm = new THREE.Mesh(box, new THREE.MeshPhongMaterial({
						color: 0xeeeeee,
						side: THREE.DoubleSide,
						transparent: true,
						opacity: 0.3,
						displacementScale: 1e-4,
						flatShading: true		// hard edges
					}));
					(<ObjectTag>this.frm.userData).discard = true
					this.obj.add(this.frm)

					!resolve || resolve(this)
				}, e => !reject || reject(e))
			}
			xhr.open("get", AssetPath + path)
			xhr.send()
		}
	}

	static async load(path: string[] | string): Promise<Building[]> {
		const paths = typeof path == "string" ? [path] : path
		return new Promise((resolve, reject) => {
			let jobs = paths.length
			const callback = () => (--jobs == 0) && resolve(buildings)
			const buildings = paths.map(path => new Building(path, callback, callback))
		})
	}

	static from(proto: Building, road: Road, offset: number): Building {
		const inst = new Building()

		inst.obj = proto.obj!.clone();
		(<ObjectTag>inst.obj.userData).object = inst

		// set pos and orientation of boj

		const bbox = new THREE.Box3().setFromObject(inst.obj)
		const min = new THREE.Vector2(bbox.min.x, bbox.min.z)
		const max = new THREE.Vector2(bbox.max.x, bbox.max.z)
		inst.bbox = new THREE.Box2(min, max)

		return inst
	}

	crossRoad(road: Road): boolean {

		//assume road width is integer
		let center = road.from.add(road.to).divideScalar(2)
		let dir = road.to.sub(road.from).normalize
		let normal = dir.
		

	}
}
import * as THREE from "three"
import ObjAsset from "./obj";
import { AssetPath, DistUnit, ObjectTag } from "./def";
import { inBox, minPt, maxPt, Point } from "../model/geometry";
import XHRJson from "./json";
import { RoadWidth } from "../model/def";

interface TransformStep {
	rotate?: number[],
	translate?: number[]
}

interface BuildingDefination {
	name: string,
	model: string,
	scale?: number[] | number,
	transform?: TransformStep[],
	placeholder: number[]
}

class BuildingPrototype {

	readonly name: string = <any>null

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

						self.name = def.name

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
}

class BuildingManager {

	private readonly resources = new Map<string, BuildingPrototype>()
	private _ready: boolean = true

	get ready() { return this._ready }

	clear() {
		this.resources.clear()
	}

	load(path: string[] | string): Promise<{}> {
		return new Promise((resolve, reject) => {
			this._ready = false
			BuildingPrototype.load(path).then((protos: (BuildingPrototype | undefined)[]) => {
				for (let proto of protos) {
					if (proto) this.resources.set(proto.name, proto)
				}
				this._ready = true
				resolve()
			})
		})
	}

	get(name: string): BuildingPrototype | undefined {
		return this.resources.get(name)
	}

}

export {
	BuildingPrototype,
	BuildingManager
}
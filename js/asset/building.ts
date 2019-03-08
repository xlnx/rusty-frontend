import * as THREE from "three"
import ObjAsset from "./obj";
import { AssetPath, DistUnit, ObjectTag, CityLayer } from "./def";
import { inBox, minPt, maxPt, Point } from "../model/geometry";;
import XHRJson from "./json";
import { RoadWidth } from "../model/def";
import { LayeredObject } from "../wrapper/util";

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

	readonly placeholder: THREE.Vector2 = <any>null

	readonly object = new LayeredObject("building")

	constructor(proto?: BuildingPrototype) {
		if (proto) {
			this.object = proto.object.clone()
			this.object.tag.object = this
			this.placeholder = proto.placeholder
		}
	}

	private static transformObject(obj: THREE.Object3D, trans: TransformStep[]) {
		for (let tr of trans) {
			if (tr.rotate) {
				obj.rotateX(tr.rotate[0])
				obj.rotateY(tr.rotate[1])
				obj.rotateZ(tr.rotate[2])
			}
			if (tr.translate) {
				obj.translateX(tr.translate[0])
				obj.translateY(tr.translate[1])
				obj.translateZ(tr.translate[2])
			}
		}
	}

	private static scaleObject(obj: THREE.Object3D, scale: number[] | number) {
		if (typeof scale == "number") {
			obj.scale.set(scale, scale, scale)
		} else {
			obj.scale.set(scale[0], scale[1], scale[2])
		}
	}

	private static adjustObject(obj: THREE.Object3D, def: BuildingDefination) {
		!def.transform || BuildingPrototype.transformObject(obj, def.transform)
		!def.scale || BuildingPrototype.scaleObject(obj, def.scale)
		obj.scale.multiplyScalar(DistUnit)
		obj.translateY(-new THREE.Box3().setFromObject(obj).min.y)
	}

	private static frameMaterial = new THREE.MeshPhongMaterial({
		color: 0xeeeeee,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 0.3,
		displacementScale: 1e-4,
		flatShading: true		// hard edges
	})
	private static planeMaterial = new THREE.MeshPhongMaterial({
		color: 0x156289,
		side: THREE.DoubleSide,
		displacementScale: 1e-4,
		flatShading: true		// hard edges
	})

	private static async doLoadProto(path: string): Promise<BuildingPrototype> {

		return new Promise((resolve, reject) => {
			new XHRJson(path).load().then(json => {
				const prefix = path.substr(0, path.lastIndexOf("/") + 1)
				const def: BuildingDefination = json

				const { placeholder } = def

				new ObjAsset(prefix + def.model).load().then((obj: THREE.Object3D) => {
					const proto = new BuildingPrototype()

					// adjust model
					BuildingPrototype.adjustObject(obj, def)
					// add plain
					const plain = new THREE.PlaneGeometry(
						placeholder[0] * DistUnit, placeholder[1] * DistUnit)
						.rotateX(Math.PI / 2)

					// build layer 0
					proto.object.addObjectsToLayer(CityLayer.origin,
						obj,
						new THREE.Mesh(plain, BuildingPrototype.planeMaterial))

					// add frame
					const { max: { y: y0 }, min: { y: y1 } } = new THREE.Box3().setFromObject(obj)
					const h = y0 - y1 + 0.05
					const frame = new THREE.BoxGeometry(
						def.placeholder[0] * DistUnit, h, def.placeholder[0] * DistUnit)
					frame.translate(0, h / 2, 0)

					// build layer 1
					proto.object.addObjectsToLayer(CityLayer.frame,
						new THREE.Mesh(frame, BuildingPrototype.frameMaterial))

					{
						const self = <any>proto
						self.name = def.name
						self.placeholder = new THREE.Vector2(def.placeholder[0], def.placeholder[1])
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
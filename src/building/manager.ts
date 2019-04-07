import { ComponentWrapper } from "aframe-typescript-toolkit";
// import { DistUnit } from "./def";
import { JsonAsset, ModelAsset } from "../wasp";

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

export class BuildingPrototype {

	readonly name: string = <any>null

	readonly placeholder: THREE.Vector2 = <any>null

	readonly object: {
		model: THREE.Object3D,
		floor: THREE.Object3D,
		frame: THREE.Object3D
	} = <any>{}

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
		// obj.scale.multiplyScalar(DistUnit)
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
			new JsonAsset(path).load().then(json => {
				const prefix = path.substr(0, path.lastIndexOf("/") + 1)
				const def = <BuildingDefination>json

				const { placeholder } = def

				new ModelAsset(prefix + def.model).load().then((obj: THREE.Object3D) => {

					// console.log(obj)
					const proto = new BuildingPrototype()

					// adjust model
					BuildingPrototype.adjustObject(obj, def)
					// add plain
					const plain = new THREE.PlaneGeometry(
						placeholder[0], placeholder[1])
						.rotateX(-Math.PI / 2)

					// add frame
					const { max: { y: y0 }, min: { y: y1 } } = new THREE.Box3().setFromObject(obj)
					const h = y0 - y1 + 0.05
					const frame = new THREE.BoxGeometry(
						def.placeholder[0], h, def.placeholder[0])
					frame.translate(0, h / 2, 0)

					// build layer 1

					// build layer 0
					proto.object.model = obj
					proto.object.floor = new THREE.Mesh(plain, BuildingPrototype.planeMaterial)
					proto.object.frame = new THREE.Mesh(frame, BuildingPrototype.frameMaterial)

					// proto.object.setMaterial(CityLayer.Origin, BuildingPrototype.planeMaterial)

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
				BuildingPrototype.doLoadProto(path.match(/\/index.json$/i) ?
					path : path + "/index.json")
					.then(e => res(e, idx), e => rej(e, idx)))
		})
	}
}

interface BuildingManagerComponentSchema {
	readonly assets: string[]
}

export class BuildingManagerComponent extends ComponentWrapper<BuildingManagerComponentSchema> {

	constructor() {
		super("building-manager", {
			assets: {
				type: "array",
				default: []
			}
		})
	}

	init() {
		this.load(this.data.assets)
	}

	private readonly resources = new Map<string, BuildingPrototype>()
	private _ready: boolean = false

	get ready() { return this._ready }

	private clear() {
		this.resources.clear()
	}

	private load(path: string[] | string): Promise<(BuildingPrototype | undefined)[]> {
		this._ready = false
		return new Promise((resolve, reject) => {
			BuildingPrototype.load(path).then((protos: (BuildingPrototype | undefined)[]) => {
				for (let proto of protos) {
					if (proto) {
						if (this.resources.has(proto.name)) {
							console.warn(`Prototype with name ${proto.name} already exists.`)
						} else {
							this.resources.set(proto.name, proto)
						}
					}
				}
				this._ready = true
				resolve(protos)
			})
		})
	}

	get(name: string): BuildingPrototype | undefined {
		return this.resources.get(name)
	}

}
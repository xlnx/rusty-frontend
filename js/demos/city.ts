import VRRendererPrototype from "../renderer/vrproto"
import * as THREE from "three"
import ObjAsset from "../asset/obj"
import * as Quadtree from "quadtree-lib"
import Building from "../asset/building";
import Selector from "../wrapper/selector";
import { DistUnit } from "../asset/def";

class BBox {
	constructor(
		public readonly x: number,
		public readonly y: number,
		public readonly width: number,
		public readonly height: number
	) { }
}

const w = 50, h = 50

export default class CityDemoRenderer extends VRRendererPrototype {

	private raycaster = new THREE.Raycaster()
	private selector = new Selector(this.scene)

	private mouse = new THREE.Vector2()

	private ground: THREE.Mesh

	private candidate?: Building

	constructor() {
		super()

		const quadTree = new Quadtree({ x: -1e5, y: -1e5, width: 1e5, height: 1e5 })
		console.log(quadTree)
		quadTree.push(new BBox(10, 10, 1, 2))
		// console.log(quadTree)

		quadTree.each(e => {
			console.log(e)
		})

		Building.load("building2-obj/building_04.json")
			.then(protos => {
				this.candidate = protos[0]
				this.scene.add(this.candidate.object!)
				// for (let proto of protos) {
				// 	const building = Building.from(proto)
				// 	this.scene.add(building.object!)
				// }
			})

		this.camera.position.z = 4

		let geometry = new THREE.PlaneGeometry(w * DistUnit, h * DistUnit, w, h)
		geometry.rotateX(-Math.PI / 2)
		geometry.translate(0, -1e-4, 0)
		let meshMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 })
		this.ground = new THREE.Mesh(geometry, meshMaterial)
		this.scene.add(this.ground)

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		this.scene.add(lightHelper)

		window.addEventListener("mousemove", (e: MouseEvent) => {
			this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
			this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
		})
	}

	OnUpdate() {
		super.OnUpdate()

		this.raycaster.setFromCamera(this.mouse, this.camera)
		const ints = this.raycaster.intersectObject(this.ground)
		if (ints.length) {
			const int = ints[0]
			const grid = int.uv!.multiply(new THREE.Vector2(w, h)).round()
				.sub(new THREE.Vector2(w, h).divideScalar(2))
				.multiply(new THREE.Vector2(1, -1))

			const pos = grid.multiplyScalar(DistUnit)

			this.candidate!.object!.position.set(pos.x, 0, pos.y)
		}

		const res = this.selector.select(this.mouse, this.camera)
		if (res) {
			const { type, object: obj } = res
			const wnd = <any>window
			if (wnd["sel"] != obj) {
				console.log("selected changed")
				wnd["sel"] = obj
			}
		}
	}

	// OnNewFrame() {
	// 	super.OnNewFrame()
	// }
}
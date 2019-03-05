import VRRendererPrototype from "../renderer/vrproto"
import * as THREE from "three"
import ObjAsset from "../asset/obj"
import * as Quadtree from "quadtree-lib"
import Building from "../asset/building";
import Selector from "../wrapper/selector";

class BBox {
	constructor(
		public readonly x: number,
		public readonly y: number,
		public readonly width: number,
		public readonly height: number
	) { }
}

export default class CityDemoRenderer extends VRRendererPrototype {

	private selector = new Selector(this.scene)

	private mouse = new THREE.Vector2()

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
				for (let proto of protos) {
					const building = Building.from(proto)
					this.scene.add(building.object!)
				}
			})

		this.camera.position.z = 4
		let geometry = new THREE.PlaneGeometry(5, 5, 100, 100)
		let meshMaterial = new THREE.MeshLambertMaterial({
			color: 0x666666,
			side: THREE.DoubleSide
		})
		let plain = new THREE.Mesh(geometry, meshMaterial)
		this.scene.add(plain)
		plain.translateY(-1e-4)
		// plain.rotateX(Math.PI/2);
		plain.rotateX(Math.PI / 2)

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

	OnNewFrame() {
		super.OnNewFrame()

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
}
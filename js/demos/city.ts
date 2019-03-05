import VRRendererPrototype from "../renderer/vrproto"
import * as THREE from "three"
import * as dat from "dat.gui"
import * as Quadtree from "quadtree-lib"
import ObjAsset from "../asset/obj"
import Building from "../asset/building"
import Selector from "../wrapper/selector"
import { DistUnit } from "../asset/def"
import Ground from "../asset/ground";

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

	private ground = new Ground(50, 50)
	private candidate?: Building

	private readonly gui = new dat.GUI()

	private point?: THREE.Vector2

	// gui controlled variables
	private mode: "building" | "road" | "preview" = "preview"

	constructor() {
		super()

		this.gui.add(this, "mode", ["building", "road", "preview"])
			.onChange((val: any) => {
				if (val == "building") {
					this.scene.add(this.candidate!.object!)
				} else {
					this.scene.remove(this.candidate!.object!)
				}
				if (val == "road") {
					this.point = undefined
				}
			})

		const quadTree = new Quadtree({ width: 1e5, height: 1e5 })
		quadTree.push(new BBox(10, 10, 1, 2))
		// console.log(quadTree)

		quadTree.each(e => {
			console.log(e)
		})

		Building.load("building2-obj/building_04.json")
			.then(protos => {
				this.candidate = protos[0]
				// this.scene.add(this.candidate.object!)
				// for (let proto of protos) {
				// 	const building = Building.from(proto)
				// 	this.scene.add(building.object!)
				// }
			})

		this.camera.position.z = 4

		this.scene.add(this.ground.object)

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		this.scene.add(lightHelper)

		window.addEventListener("mousemove", (e: MouseEvent) => {
			this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
			this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
		})
		window.addEventListener("mousedown", (e: MouseEvent) => {
			if (this.mode == "road") {
				this.point = this.ground.intersect(this.mouse, this.camera)
			}
		})
		window.addEventListener("mouseup", (e: MouseEvent) => {
			if (this.mode == "road") {
				const coord = this.ground.intersect(this.mouse, this.camera)
				if (coord) {
					// 
				}
				this.point = undefined
			}
		})
	}

	OnUpdate() {
		super.OnUpdate()

		switch (this.mode) {
			case "road": {
				if (this.point) {
					//
				}
			} break
			case "building": {
				const coord = this.ground.intersect(this.mouse, this.camera)
				if (coord) {
					const pos = coord.multiplyScalar(DistUnit)
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
			} break
		}
	}

	// OnNewFrame() {
	// 	super.OnNewFrame()
	// }
}
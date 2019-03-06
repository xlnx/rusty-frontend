import VRRendererPrototype from "../renderer/vrproto"
import * as THREE from "three"
import * as dat from "dat.gui"
import * as Quadtree from "quadtree-lib"
import ObjAsset from "../asset/obj"
import Building from "../asset/building"
import Selector from "../wrapper/selector"
import { DistUnit } from "../asset/def"
import Ground from "../asset/ground";
import TexAsset from "../asset/tex";
import RoadPrototype from "./road";

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
	private road?: RoadPrototype

	private readonly gui = new dat.GUI()

	// gui controlled variables
	private mode: "building" | "road" | "preview" = "preview"

	constructor() {
		super()

		this.scene.add(new THREE.Mesh(new THREE.RingGeometry(1, 2, 32),
			new THREE.ShaderMaterial({
				fragmentShader: "void main() { gl_FragColor = vec4(1, 1, 1, 0.1); }",
				side: THREE.DoubleSide,
				transparent: true
			})))

		this.gui.add(this, "mode", ["building", "road", "preview"])
			.onChange((val: any) => {
				if (val == "building") {
					this.scene.add(this.candidate!.object!)
				} else {
					this.scene.remove(this.candidate!.object!)
				}
				if (val == "road") {
					this.orbit.enabled = false
				} else {
					this.orbit.enabled = true
				}
				this.road = undefined
			})

		const quadTree = new Quadtree({ width: 1e5, height: 1e5 })
		quadTree.push(new BBox(10, 10, 1, 2))
		// console.log(quadTree)

		quadTree.each(e => {
			console.log(e)
		})

		// const road = new RoadPrototype(new THREE.Vector2(-10, 0), new THREE.Vector2(5, 5))
		// this.scene.add(road.object)

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
				const point = this.ground.intersect(this.mouse, this.camera)
				this.road = new RoadPrototype(point!, point!)
				this.scene.add(this.road.object)
			}
		})
		window.addEventListener("mouseup", (e: MouseEvent) => {
			if (this.mode == "road") {
				const coord = this.ground.intersect(this.mouse, this.camera)
				if (coord) {
					this.road!.to = coord
				}
				this.road = undefined
			}
		})
	}

	OnUpdate() {
		super.OnUpdate()

		switch (this.mode) {
			case "road": {
				if (this.road) {
					const coord = this.ground.intersect(this.mouse, this.camera)
					if (coord) {
						this.road!.to = coord
					}
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

	OnNewFrame() {
		const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1)
		// ortho.rotateX(Math.PI / 2)
		// this.scene.add(new THREE.CameraHelper(ortho))
		// ortho.rotation.set()

		this.threeJsRenderer.render(this.scene, ortho, this.ground.target)

		super.OnNewFrame()
	}
}
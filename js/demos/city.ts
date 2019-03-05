import VRRendererPrototype from "../renderer/vrproto"
import * as THREE from "three"
import ObjAsset from "../asset/obj"
import * as Quadtree from "quadtree-lib"

class BBox {
	constructor(
		public readonly x: number,
		public readonly y: number,
		public readonly width: number,
		public readonly height: number
	) { }
}

export default class CityDemoRenderer extends VRRendererPrototype {

	private raycaster = new THREE.Raycaster()

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

		new ObjAsset("building2-obj/building_04.obj").load()
			.then((obj: THREE.Object3D) => {
				obj.scale.set(0.3, 0.3, 0.3)
				// obj.rotateX(-3.14 / 2)
				// obj.rotateZ(-3.14)
				this.scene.add(obj)
			})

		this.camera.position.z = 4
		let geometry = new THREE.PlaneGeometry(5, 5, 100, 100)
		let meshMaterial = new THREE.MeshPhongMaterial({
			color: 0x156289,
			emissive: 0x072534,
			side: THREE.DoubleSide,
			// displacementMap: g.texture,
			displacementScale: 1e-4,
			flatShading: true		// hard edges
		})
		let plain = new THREE.Mesh(geometry, meshMaterial)
		this.scene.add(plain)
		plain.translateY(-1e-4)
		// plain.rotateX(Math.PI/2);
		plain.rotateX(Math.PI / 2)

		let light = new THREE.PointLight(0xffffff, 1, 0)
		light.position.set(0, 3, 2)
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
		this.raycaster.setFromCamera(this.mouse, this.camera)

		let intersects = this.raycaster.intersectObjects(this.scene.children)

		// console.log(intersects[0])
		if (intersects.length) {
			console.log(intersects[0].uv)
		}
	}
}
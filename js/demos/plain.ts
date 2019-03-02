import VRRendererPrototype from "../renderer/vrproto"
import * as THREE from "three"

export default class PlainDemoRenderer extends VRRendererPrototype {

	private raycaster = new THREE.Raycaster()

	private mouse = new THREE.Vector2()

	constructor() {
		super()

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
		// plain.rotateX(Math.PI/2);
		plain.rotateX(2 * Math.PI / 3)

		let light = new THREE.PointLight(0xffffff, 1, 0)
		light.position.set(0, .5, .5)
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
import * as THREEJS from "three"
import * as THREE_ADDONS from "three-addons"
const THREE: typeof import("three") = { ...THREEJS, ...THREE_ADDONS }
import { LayeredView, DirectRenderer, Pipeline, RenderStage, PostStage, Prefab } from "../wasp";

class G extends THREE.BufferGeometry {
	constructor() {
		super()

		let vertices = new Float32Array([
			1, 1, 1,
			1, -1, 1,
			-1, -1, 1,
			-1, 1, 1,
			1, 1, -1,
			1, -1, -1,
			-1, -1, -1,
			-1, 1, -1,
		])
		let indices = [
			0, 2, 1,
			0, 3, 2,

			4, 5, 6,
			4, 6, 7,

			2, 3, 7,
			2, 7, 6,

			0, 4, 3,
			4, 7, 3,

			1, 2, 5,
			2, 6, 5,

			0, 1, 4,
			1, 5, 4
		]
		this.addAttribute("position", new THREE.BufferAttribute(vertices, 3))
		this.setIndex(indices)
	}
}

export default class MyRenderer extends DirectRenderer {

	private box = new LayeredView()
	private state: "normal" | "profile" = "normal"
	private pipeline = new Pipeline(this.threeJsRenderer)

	matNormal = new THREE.MeshPhysicalMaterial({
		color: 0x156289,
		displacementScale: 1e-4,
		flatShading: true		// hard edges
	})

	constructor() {
		super()

		this.gui.add(this, "state", ["normal", "profile"])

		this.camera.position.z = 4

		let geo = new G()
		geo.rotateX(-Math.PI / 3)
		geo.translate(0, -1e-4, 0)
		let box = new THREE.Mesh(geo, this.matNormal)
		this.box.addToLayer(0, box)
		this.scene.add(this.box)

		this.scene.add(new THREE.AmbientLight(0xcccccc))

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		lightHelper.layers.mask = 0xffffffff
		this.scene.add(lightHelper)

		const { begin } = this.pipeline
		begin.then(new RenderStage(this.scene, this.camera))
			.then(Prefab.FXAAShader)
			.out()
	}

	OnNewFrame() {
		this.pipeline.render()

		requestAnimationFrame(this.nextFrame)
	}
}
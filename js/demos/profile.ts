import * as THREE from "three"
import { LayeredView, DirectRenderer, Pipeline, RenderStage, Stage, Effect, PostStage, Thing } from "../wasp";


import * as frag from "./asset/a.frag"
import * as vert from "./asset/a.vert"

export default class MyRenderer extends DirectRenderer {

	// box = new LayeredView()
	box = new Thing()
	state: "normal" | "profile" = "profile"

	matNormal = new THREE.MeshLambertMaterial({ color: 0x666666 })

	constructor() {
		super()

		this.gui.add(this, "state", ["normal", "profile"])

		this.camera.position.z = 4

		let geo = new THREE.IcosahedronGeometry(1, 1)
		geo.rotateX(-Math.PI / 3)
		geo.rotateY(-Math.PI / 4)
		geo.computeVertexNormals(true)

		// let geo = new THREE.PlaneGeometry(5, 5, 100, 100)
		// geo.rotateX(-Math.PI / 3)
		// geo.translate(0, -1e-4, 0)
		let box = new THREE.Mesh(geo, this.matNormal)
		this.box.view.addToLayer(0, box)

		this.scene.add(new THREE.AmbientLight(0xdddddd))

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		lightHelper.layers.mask = 0xffffffff
		this.scene.add(lightHelper)


		const obj: Stage = new RenderStage(this.scene, this.camera)
		const profile: Stage = new RenderStage(this.scene, this.camera, {
			uniforms: { film: { type: "t" } },
			vertexShader: vert,
			fragmentShader: frag
		})

		this.pipeline.begin
			.then(obj).as("film")
			.then(profile)
			.out()
	}

	// private target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
	// 	minFilter: THREE.LinearFilter,
	// 	magFilter: THREE.LinearFilter,
	// 	format: THREE.RGBFormat
	// })
	private pipeline = new Pipeline(this.threeJsRenderer)
	// private clock = new THREE.Clock()

	OnUpdate() {
		const time = window.performance.now() * 0.0001

		const speed = 2e-2

		this.box.view.rotation.x += Math.sin(time) * speed
		this.box.view.rotation.y += Math.cos(time) * speed
	}

	OnNewFrame() {
		({
			profile: () => { this.pipeline.render() },
			normal: () => { this.threeJsRenderer.render(this.scene, this.camera) }
		})[this.state]()

		requestAnimationFrame(this.nextFrame)
	}
}
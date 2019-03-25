import * as THREE from "three"
import { LayeredView, DirectRenderer, Pipeline, RenderStage, Stage, Effect, PostStage } from "../wasp";
import { FFTWaveEffect } from "../wasp/prefab";

export default class MyRenderer extends DirectRenderer {

	box = new LayeredView()
	state: "normal" | "profile" = "normal"

	private fftEffect = new FFTWaveEffect()

	matNormal = new THREE.MeshPhysicalMaterial({
		color: 0x156289,
		side: THREE.DoubleSide,
		displacementMap: this.fftEffect.textures[0],
		displacementScale: 1e-4,
		flatShading: true		// hard edges
	})

	constructor() {
		super()

		this.gui.add(this, "state", ["normal", "profile"])

		this.camera.position.z = 4

		let geo = new THREE.PlaneGeometry(5, 5, 100, 100)
		geo.rotateX(-Math.PI / 3)
		geo.translate(0, -1e-4, 0)
		let box = new THREE.Mesh(geo, this.matNormal)
		this.box.addToLayer(0, box)
		this.scene.add(this.box)

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		lightHelper.layers.mask = 0xffffffff
		this.scene.add(lightHelper)

		const { begin } = this.pipeline
		const res = begin.then(this.fftEffect)
		// .then(CopyShader, target)
		// .out()

		// res
		// .out()
	}

	// private target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
	// 	minFilter: THREE.LinearFilter,
	// 	magFilter: THREE.LinearFilter,
	// 	format: THREE.RGBFormat
	// })
	private pipeline = new Pipeline(this.threeJsRenderer)

	OnUpdate() {
		// const time = window.performance.now() * 0.0001

		// const speed = 2e-2

		// this.box.rotation.x += Math.sin(time) * speed
		// this.box.rotation.y += Math.cos(time) * speed
	}

	OnNewFrame() {
		this.pipeline.render()

		this.threeJsRenderer.render(this.scene, this.camera)

		requestAnimationFrame(this.nextFrame)
	}
}
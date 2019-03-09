import * as THREEJS from "three"
import * as THREE_ADDONS from "three-addons"
const THREE: typeof import("three") = { ...THREEJS, ...THREE_ADDONS }
import { LayeredView, DirectRenderer, Pipeline, RenderStage, Stage, Effect, PostStage, Prefab } from "../wasp";

class FFTWaveEffect extends Effect {

	constructor(width: number = 256) {
		super()

		const target = new THREE.WebGLRenderTarget(width, width, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			type: THREE.FloatType,
			stencilBuffer: false
		})
		this.textures.push(target.texture)

		const phillips = new PostStage({ fragmentShader: require("./shaders/phillips.frag") })
		const gaussian = new PostStage({ fragmentShader: require("./shaders/gaussian.frag") })
		const fftsrcH = new PostStage({
			uniforms: { spectrum: { type: 't' }, gaussian: { type: 't' } },
			fragmentShader: require("./shaders/fftsrcH.frag")
		})
		const fftsrcDxy = new PostStage({
			uniforms: { H: { type: 't' } },
			fragmentShader: require("./shaders/fftsrcDxy.frag")
		})
		const fftvr = new PostStage({
			uniforms: { prev: { type: 't' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/fftvr.frag")
		});
		const fftv = new PostStage({
			uniforms: { prev: { type: 't' }, unit: { type: 'f' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/fftv.frag")
		})
		const ffthr = new PostStage({
			uniforms: { prev: { type: 't' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/ffthr.frag")
		})
		const ffth = new PostStage({
			uniforms: { prev: { type: 't' }, unit: { type: 'f' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/ffth.frag")
		})
		const fftend = new PostStage({
			uniforms: { prevH: { type: 't' }, prevDxy: { type: 't' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/fftend.frag")
		})

		const phillipsNode = this.begin.then(phillips, target.clone())
		const gaussianNode = this.begin.then(gaussian, target.clone())
		const srcH = phillipsNode.and(gaussianNode)
			.as("spectrum", "gaussian")
			.then(fftsrcH, target.clone())
		const srcDxy = srcH.as("H")
			.then(fftsrcDxy, target.clone())

		let h = srcH.as("prev").then(fftvr, target.clone())
		let dxy = srcDxy.as("prev").then(fftvr, target.clone())

		for (let i = 1; i != width; i *= 2) {
			h = h.as("prev").then(fftv, target.clone()).set({ unit: i })
			dxy = dxy.as("prev").then(fftv, target.clone()).set({ unit: i })
		}

		h = h.as("prev").then(ffthr, target.clone())
		dxy = dxy.as("prev").then(ffthr, target.clone())

		for (let i = 1; i != width; i *= 2) {
			h = h.as("prev").then(ffth, target.clone()).set({ unit: i })
			dxy = dxy.as("prev").then(ffth, target.clone()).set({ unit: i })
		}

		const res = h.and(dxy).as("prevH", "prevDxy")
			.then(fftend, target)
	}
}

export default class MyRenderer extends DirectRenderer {

	box = new LayeredView()
	state: "normal" | "profile" = "normal"

	private fftEffect = new FFTWaveEffect()

	matNormal = new THREE.MeshPhongMaterial({
		color: 0x156289,
		emissive: 0x072534,
		side: THREE.DoubleSide,
		displacementMap: this.fftEffect.textures[0],
		displacementScale: 1e-4,
		flatShading: true		// hard edges
	})

	constructor() {
		super()

		this.gui.add(this, "state", ["normal", "profile"])

		this.camera.position.z = 4

		let geo = new THREE.PlaneGeometry(4, 4, 100, 100)
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
		// .then(Prefab.CopyShader, target)
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
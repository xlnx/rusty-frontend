import * as THREE from "three"
import { PostStage, Effect } from "../../../post";

export class FFTWaveEffect<T=any> extends Effect<T> {

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
import * as THREE from "three"
import { Effect, PostStage } from "../../../post";

const DepthLimitedBlurShader = {
	defines: {
		KERNEL_RADIUS: 4,
	},
	uniforms: {
		tDiffuse: { type: 't', value: <any>null },
		sampleUvOffsets: { type: 'v2v', value: [new THREE.Vector2(0, 0)] },
		sampleWeights: { type: '1fv', value: [1.0] },
		tDepth: { type: 't', value: <any>null },
		cameraNear: { type: 'f', value: 10 },
		cameraFar: { type: 'f', value: 1000 },
		depthCutoff: { type: 'f', value: 0.1 },
	},
	fragmentShader: require("./shaders/blur.frag")
}

const BlurShaderUtils = {

	createSampleWeights: (kernelRadius: number, stdDev: number) => {
		const gaussian = (x: number, stdDev: number) =>
			Math.exp(- (x * x) / (2.0 * (stdDev * stdDev))) / (Math.sqrt(2.0 * Math.PI) * stdDev);

		const weights: number[] = []
		for (let i = 0; i <= kernelRadius; i++) {
			weights.push(gaussian(i, stdDev))
		}

		return weights
	},

	createSampleOffsets: (kernelRadius: number, uvIncrement: THREE.Vector2) => {
		const offsets: THREE.Vector2[] = []

		for (let i = 0; i <= kernelRadius; i++) {
			offsets.push(uvIncrement.clone().multiplyScalar(i))
		}

		return offsets
	},

	configure: (material: THREE.ShaderMaterial, kernelRadius: number, stdDev: number, uvIncrement: THREE.Vector2) => {
		material.defines['KERNEL_RADIUS'] = kernelRadius
		material.uniforms['sampleUvOffsets'].value = BlurShaderUtils.createSampleOffsets(kernelRadius, uvIncrement)
		material.uniforms['sampleWeights'].value = BlurShaderUtils.createSampleWeights(kernelRadius, stdDev)
		material.needsUpdate = true
	}

}

interface DepthLimitedBlurEffectParam {
	resolution: THREE.Vector2,
	depthTexture: THREE.Texture,
	image: THREE.Texture,
	camera: THREE.PerspectiveCamera,
	radius: number,
	stddev: number,
	depthCutoff: number
}

export class DepthLimitedBlurEffect<T=any> extends Effect<T> {

	constructor(params: DepthLimitedBlurEffectParam) {

		super()

		const { image, camera, depthTexture, radius, stddev, depthCutoff } = params
		const { width, height } = params.resolution

		const vtarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat
		})
		const htarget = vtarget.clone()
		this.textures.push(vtarget.texture)

		const shader: typeof DepthLimitedBlurShader = Object.assign({}, DepthLimitedBlurShader)
		shader.uniforms = Object.assign({}, shader.uniforms)
		for (const key in shader.uniforms) {
			shader.uniforms[key] = Object.assign({}, shader.uniforms[key])
		}
		shader.uniforms.tDepth.value = depthTexture

		const hshader: typeof DepthLimitedBlurShader = Object.assign({}, shader)
		hshader.uniforms = Object.assign({}, hshader.uniforms)
		for (const key in hshader.uniforms) {
			hshader.uniforms[key] = Object.assign({}, hshader.uniforms[key])
		}
		const hstage = new PostStage(hshader)
		const vstage = new PostStage(shader)
		hstage.shaderMaterial!.uniforms.tDiffuse.value = image
		vstage.shaderMaterial!.uniforms.tDiffuse.value = htarget.texture
		BlurShaderUtils.configure(hstage.shaderMaterial!, radius, stddev, new THREE.Vector2(0, 1))
		BlurShaderUtils.configure(vstage.shaderMaterial!, radius, stddev, new THREE.Vector2(1, 0))

		this.begin
			.thenExec(() => {
				hstage.shaderMaterial!.uniforms.cameraNear.value = camera.near
				hstage.shaderMaterial!.uniforms.cameraFar.value = camera.far

				vstage.shaderMaterial!.uniforms.cameraNear.value = camera.near
				vstage.shaderMaterial!.uniforms.cameraFar.value = camera.far
			})
			.then(hstage, htarget)
			.then(vstage, vtarget)
	}

}
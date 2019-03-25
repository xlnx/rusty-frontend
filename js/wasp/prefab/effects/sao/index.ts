import * as THREE from "three"
import { Effect } from "../../../post/pipeline";
import { PostStage, Shader, RenderOptions, RenderStage } from "../../../post/stage";

const SAOShader = {
	defines: {
		NUM_SAMPLES: 7,
		NUM_RINGS: 4,
		DIFFUSE_TEXTURE: 0
	},
	uniforms: {

		tDepth: { type: 't', value: <any>null },
		tDiffuse: { type: 't', value: <any>null },
		tNormal: { type: 't', value: <any>null },
		// size: { type: 'v2', value: new THREE.Vector2(512, 512) },

		cameraNear: { type: 'f', value: 1 },
		cameraFar: { type: 'f', value: 100 },
		cameraProjectionMatrix: { type: 'm4', value: new THREE.Matrix4() },
		cameraInverseProjectionMatrix: { type: 'm4', value: new THREE.Matrix4() },

		bias: { type: 'f', value: 0.5 },
		intensity: { type: 'f', value: 0.1 },
		scale: { type: 'f', value: 1.0 },
		kernelRadius: { type: 'f', value: 100.0 },
		minResolution: { type: 'f', value: 0.0 },

		randomSeed: { type: 'f', value: 0.0 }
	},
	fragmentShader: require("./shaders/sao.frag")
}

interface SAOEffectParams {
	resolution: THREE.Vector2,
	depthTexture: THREE.Texture,
	normalTexture: THREE.Texture,
	diffuseTexture?: THREE.Texture,
	camera: THREE.PerspectiveCamera,
	uniforms?: {
		bias?: number,
		intensity?: number,
		scale?: number,
		kernelRadius?: number,
		minResolution?: number,
	}
}

export class SAOEffect<T=any> extends Effect<T> {

	constructor(params: SAOEffectParams) {

		super()

		const { depthTexture, normalTexture, camera, uniforms, diffuseTexture } = Object.assign({
			uniforms: {}
		}, params)
		const { width, height } = params.resolution

		const saoRenderTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat
		})
		this.textures.push(saoRenderTarget.texture)

		const shader: typeof SAOShader = Object.assign({}, SAOShader)
		for (const key in shader.uniforms) {
			shader.uniforms[key] = Object.assign({}, shader.uniforms[key])
		}
		if (diffuseTexture) {
			shader.defines.DIFFUSE_TEXTURE = 1
			shader.uniforms.tDiffuse.value = diffuseTexture
		}
		shader.uniforms.tDepth.value = depthTexture
		shader.uniforms.tNormal.value = normalTexture
		shader.uniforms.cameraInverseProjectionMatrix.value.getInverse(camera.projectionMatrix)
		shader.uniforms.cameraProjectionMatrix.value = camera.projectionMatrix
		// shader.uniforms

		const stage = new PostStage(shader)
		stage.shaderMaterial!.extensions.derivatives = true

		this.begin
			// .then(new RenderStage(), saoRenderTarget)
			.thenExec(() => {
				stage.shaderMaterial!.uniforms.cameraNear.value = camera.near
				stage.shaderMaterial!.uniforms.cameraFar.value = camera.far

				for (const key in uniforms) {
					stage.shaderMaterial!.uniforms[key].value = uniforms[key]
				}

				stage.shaderMaterial!.needsUpdate = true
			})
			.then(stage, saoRenderTarget)
	}
}



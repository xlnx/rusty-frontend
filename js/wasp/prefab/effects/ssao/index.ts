import * as THREE from "three"
import { Effect } from "../../../post/pipeline";
import { PostStage, Shader, RenderOptions, RenderStage } from "../../../post/stage";
import * as SimplexNoise from "simplex-noise"

const kernelSize = 32

const SSAOShader = {
	defines: {
		KERNEL_SIZE: 32
	},
	uniforms: {

		tDepth: { value: <any>null },
		tDiffuse: { value: <any>null },
		tNormal: { value: <any>null },
		tNoise: { value: <any>null },

		cameraNear: { value: <any>null },
		cameraFar: { value: <any>null },
		cameraProjectionMatrix: { value: new THREE.Matrix4() },
		cameraInverseProjectionMatrix: { value: new THREE.Matrix4() },

		kernel: { value: <any>null },
		kernelRadius: { value: 8 },
		minDistance: { value: 0.005 },
		maxDistance: { value: 0.05 },
	},
	fragmentShader: require("./shaders/ssao.frag")
}

interface SSAOEffectParams {
	resolution: THREE.Vector2,
	depthTexture: THREE.Texture,
	normalTexture: THREE.Texture,
	camera: THREE.PerspectiveCamera,
	uniforms?: {
		kernelRadius?: number,
		minDistance?: number,
		maxDistance?: number,
	}
}

export class SSAOEffect<T=any> extends Effect<T> {

	private readonly kernel: THREE.Vector3[] = []
	private noiseTexture!: THREE.DataTexture

	constructor(params: SSAOEffectParams) {

		super()

		const { depthTexture, normalTexture, camera, uniforms } = Object.assign({
			uniforms: {}
		}, params)
		const { width, height } = params.resolution

		this.generateSampleKernel(kernelSize)
		this.generateRandomKernelRotations()

		const ssaoRenderTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat
		})
		this.textures.push(ssaoRenderTarget.texture)
		// this.textures.push(this.noiseTexture)

		const shader: typeof SSAOShader = Object.assign({}, SSAOShader)
		for (const key in shader.uniforms) {
			shader.uniforms[key] = Object.assign({}, shader.uniforms[key])
		}
		shader.uniforms.tDepth.value = depthTexture
		shader.uniforms.tNormal.value = normalTexture
		shader.uniforms.tNoise.value = this.noiseTexture
		shader.uniforms.cameraInverseProjectionMatrix.value.getInverse(camera.projectionMatrix)
		shader.uniforms.cameraProjectionMatrix.value = camera.projectionMatrix
		shader.uniforms.kernel.value = this.kernel
		// shader.uniforms

		const stage = new PostStage(shader)
		stage.shaderMaterial!.extensions.derivatives = true

		this.begin
			// .then(new RenderStage(), ssaoRenderTarget)
			.thenExec(() => {
				stage.shaderMaterial!.uniforms.cameraNear.value = camera.near
				stage.shaderMaterial!.uniforms.cameraFar.value = camera.far

				for (const key in uniforms) {
					stage.shaderMaterial!.uniforms[key].value = uniforms[key]
				}

				stage.shaderMaterial!.needsUpdate = true
			})
			.then(stage, ssaoRenderTarget)
	}

	private generateSampleKernel(kernelSize: number) {

		let kernel = this.kernel;

		for (let i = 0; i < kernelSize; i++) {

			let sample = new THREE.Vector3();
			sample.x = (Math.random() * 2) - 1;
			sample.y = (Math.random() * 2) - 1;
			sample.z = Math.random();

			sample.normalize();

			let scale = i / kernelSize;
			scale = THREE.Math.lerp(0.1, 1, scale * scale);
			sample.multiplyScalar(scale);

			kernel.push(sample);
		}
	}

	private generateRandomKernelRotations() {

		var width = 4, height = 4;

		var simplex = new SimplexNoise();

		var size = width * height;
		var data = new Float32Array(size * 4);

		for (var i = 0; i < size; i++) {

			var stride = i * 4;

			var x = (Math.random() * 2) - 1;
			var y = (Math.random() * 2) - 1;
			var z = 0;

			var noise = simplex.noise3D(x, y, z);

			data[stride] = noise;
			data[stride + 1] = noise;
			data[stride + 2] = noise;
			data[stride + 3] = 1;
		}

		this.noiseTexture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
		this.noiseTexture.wrapS = THREE.RepeatWrapping;
		this.noiseTexture.wrapT = THREE.RepeatWrapping;
		this.noiseTexture.needsUpdate = true;
	}
}



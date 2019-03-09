import * as THREE from "three"

export abstract class Stage {

	public readonly isStage = true

	abstract render(source: THREE.Texture[], renderer: THREE.WebGLRenderer, target?: THREE.WebGLRenderTarget)
}

interface Shader {
	uniforms?: { [uniform: string]: THREE.IUniform },
	vertexShader: string,
	fragmentShader: string
}

export class RenderStage extends Stage {

	private static header = `
	#define MAX_INPUT_CHANNEL 16
	uniform sampler2D iChannel[MAX_INPUT_CHANNEL];
	uniform vec2 iResolution;
	`

	private material?: THREE.ShaderMaterial
	private props = {
		iResolution: { value: new THREE.Vector2() },
		iChannel: <{ value: THREE.Texture[] }>{ type: "t", value: [] }
	}

	constructor(
		protected readonly scene: THREE.Scene,
		protected readonly camera: THREE.Camera, shader?: Shader
	) {
		super()

		if (shader) {
			const sh = Object.assign({ uniforms: {} }, shader)
			Object.assign(sh.uniforms, this.props)
			sh.fragmentShader = RenderStage.header + sh.fragmentShader
			this.material = new THREE.ShaderMaterial(sh)
		}
	}

	render(source: THREE.Texture[], renderer: THREE.WebGLRenderer, target?: THREE.WebGLRenderTarget) {
		this.props.iChannel.value = source
		const { width, height } = target ? target : renderer.getSize()
		this.props.iResolution.value.set(width, height)

		const { overrideMaterial } = this.scene
		this.scene.overrideMaterial = this.material ? this.material : null
		renderer.render(this.scene, this.camera, target)
		this.scene.overrideMaterial = overrideMaterial
	}
}

interface FragmentShader {
	uniforms?: { [uniform: string]: THREE.IUniform },
	fragmentShader: string
}

export class PostStage extends RenderStage {

	private static geo = new THREE.PlaneGeometry(2, 2)
	private static cam = new THREE.Camera()

	constructor(shader: FragmentShader) {
		const sh = Object.assign({
			vertexShader: "void main() { gl_Position = vec4(position, 1); }",
			uniforms: {}
		}, shader)
		const scene = new THREE.Scene()
		scene.add(new THREE.Mesh(PostStage.geo))

		super(scene, PostStage.cam, sh)
	}
}

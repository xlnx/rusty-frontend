import * as THREE from "three"

export abstract class Stage {

	public renderToScreen = false

	abstract render(source: THREE.Texture, renderer: THREE.WebGLRenderer, target?: THREE.WebGLRenderTarget)
}

export class RenderStage extends Stage {
	constructor(
		protected readonly scene: THREE.Scene,
		protected readonly camera: THREE.Camera
	) { super() }

	render(source: THREE.Texture, renderer: THREE.WebGLRenderer, target?: THREE.WebGLRenderTarget) {
		renderer.render(this.scene, this.camera, target)
	}
}

export class ShaderStage extends RenderStage {

	private static header = `
	uniform sampler2D iStage;
	uniform vec2 iResolution;
	`

	private material: THREE.ShaderMaterial
	private props = {
		iResolution: { value: new THREE.Vector2() },
		iStage: <{ value?: THREE.Texture }>{ type: "t" }
	}

	constructor(scene: THREE.Scene, camera: THREE.Camera, shader: THREE.Shader) {
		super(scene, camera)

		const sh = Object.assign({}, shader)
		if (!sh.uniforms) sh.uniforms = {}
		Object.assign(sh.uniforms, this.props)
		sh.fragmentShader = ShaderStage.header + sh.fragmentShader
		this.material = new THREE.ShaderMaterial(sh)
	}

	render(source: THREE.Texture, renderer: THREE.WebGLRenderer, target?: THREE.WebGLRenderTarget) {
		this.props.iStage.value = source
		const { width, height } = target ? target : renderer.getSize()
		this.props.iResolution.value.set(width, height)

		const { overrideMaterial } = this.scene
		this.scene.overrideMaterial = this.material
		super.render(source, renderer, target)
		this.scene.overrideMaterial = overrideMaterial
	}
}

export class PostStage extends ShaderStage {

	private static geo = new THREE.PlaneGeometry(2, 2)
	private static cam = new THREE.Camera()

	constructor(shader: THREE.Shader) {
		const sh = Object.assign({}, shader)
		sh.vertexShader = "void main() { gl_Position = vec4(position, 1); }"

		const scene = new THREE.Scene()
		scene.add(new THREE.Mesh(PostStage.geo))

		super(scene, PostStage.cam, shader)
	}
}

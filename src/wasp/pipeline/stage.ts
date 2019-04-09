import * as glsl from "glslify"

const PostStageVertexShader = `
	varying vec2 vUv;
	void main() {
		gl_Position = vec4(position, 1);
		vUv = uv;
	}`

export interface Shader extends THREE.ShaderMaterialParameters {
	fragmentShader: string
}

export interface RenderOptions {
	iChannel: { texture: THREE.Texture, alias?: string }[]
	uniforms?: { [key: string]: any },
	target?: THREE.WebGLRenderTarget
}

export interface Renderable<T extends {} = any> {
	render(options: T & RenderOptions, renderer: THREE.WebGLRenderer): void
}

export abstract class Stage<T = any> {

	public readonly isStage = true

	abstract render(source: T & RenderOptions, renderer: THREE.WebGLRenderer): void
}

export class RenderStage<T = any> extends Stage<T> implements Renderable<T> {

	private static header = `
	#define MAX_INPUT_CHANNEL 16
	uniform sampler2D iChannel[MAX_INPUT_CHANNEL];
	uniform vec2 iResolution;
	uniform float iTime;
	`

	private _material?: THREE.Material
	private props = {
		iResolution: { value: new THREE.Vector2() },
		iTime: { value: window.performance.now() * 1e-3 },
		iChannel: <{ value: THREE.Texture[] }>{ type: "t", value: [] }
	}
	get material() { return this._material }
	get shaderMaterial() {
		return this._material instanceof THREE.ShaderMaterial ?
			<THREE.ShaderMaterial>this._material : undefined
	}

	constructor(
		protected readonly scene: THREE.Scene,
		protected readonly camera: THREE.Camera, shader?: Shader | THREE.Material
	) {
		super()

		if (shader) {
			if ((<THREE.Material>shader).isMaterial) {
				shader = <THREE.Material>shader
				this._material = shader
			} else {
				shader = <Shader>shader
				const sh = Object.assign({ uniforms: {} }, shader)
				this.props = Object.assign(sh.uniforms, this.props)
				sh.fragmentShader = RenderStage.header + sh.fragmentShader
				sh.vertexShader = glsl(sh.vertexShader)
				sh.fragmentShader = glsl(sh.fragmentShader)
				this._material = new THREE.ShaderMaterial(sh)
			}
		}
	}

	render(source: T & RenderOptions, renderer: THREE.WebGLRenderer) {
		this.props.iChannel.value = source.iChannel.map(c => c.texture)
		for (const c of source.iChannel.filter(c => c.alias && this.props[c.alias])) {
			this.props[c.alias!].value = c.texture
		}
		for (const u in source.uniforms) {
			if (this.props[u]) this.props[u].value = source.uniforms[u]
		}
		const { width, height } = source.target ? source.target : renderer.getSize()
		this.props.iResolution.value.set(width, height)
		this.props.iTime.value = window.performance.now() * 1e-3

		const { overrideMaterial } = this.scene
		this.scene.overrideMaterial = this._material ? this._material : null
		renderer.render(this.scene, this.camera, source.target)
		this.scene.overrideMaterial = overrideMaterial
	}

	set(uniform: string, value: any) {
		if (uniform in this.props) {
			this.props[uniform].value = value
		}
	}
}

export class PostStage<T = any> extends RenderStage<T> {

	private static geo = new THREE.PlaneGeometry(2, 2)
	private static cam = new THREE.Camera()

	constructor(shader: Shader) {
		const sh = Object.assign({}, shader)
		sh.vertexShader = PostStageVertexShader
		const scene = new THREE.Scene()

		scene.add(new THREE.Mesh(PostStage.geo))

		super(scene, PostStage.cam, sh)
	}

}
import { Renderable, RenderOptions, PostStage } from "./stage";

export const gBuffer: THREE.WebGLRenderTargetOptions = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.FloatType,
	stencilBuffer: false
}

export abstract class Effect<T = any> implements Renderable<T> {

	public readonly isEffect = true

	public readonly textures: THREE.Texture[] = []

	protected readonly begin = new PipelineOriginNode()

	render(source: T & RenderOptions, renderer: THREE.WebGLRenderer) {
		this.begin.render(source, renderer)
	}
}

export abstract class PipelineNodeBase<T = any> {

	public readonly isPipelineNode = true
	private callbacks: (() => void)[] = []

	protected next: PipelineNodeBase[] = []

	protected constructor(protected readonly prev?: PipelineNodeBase) { }

	protected add<X extends PipelineNodeBase<T>>(e: X): X {
		this.next.push(e); return e
	}

	thenExec(f: (() => void)): this {
		this.callbacks.push(f)
		return this
	}

	then(what: Renderable, target?: THREE.WebGLRenderTarget): PipelineNode {
		return this.add(new (<any>PipelineNode)(this, what, target))
	}

	protected reset() { for (const x of this.next) x.reset() }

	protected render(source: T, renderer: THREE.WebGLRenderer) {
		for (const f of this.callbacks) f()
		for (const node of this.next) node.render(source, renderer)
	}

	protected getOutputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return []
	}

	protected getInputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return this.prev!.getOutputChannels()
	}
}

abstract class PipelineNodeAsable<T = any> extends PipelineNodeBase<T> {

	as(...uniform: string[]): PipelineAsNode {
		return this.add(new (<any>PipelineAsNode)(this, ...uniform))
	}

	abstract and(...node: PipelineNode[]): PipelineBarrierNode

	protected getTargetTextures(): THREE.Texture[] {
		return []
	}

	out(channel: number = 0): PipelineOutNode<T> {
		return this.add(new (<any>PipelineOutNode)(this, channel))
	}

	protected getOutputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return this.getTargetTextures().map((tex, idx) => { return { texture: tex } })
	}
}

export class PipelineAsNode<T = any> extends PipelineNodeAsable<T> {

	protected name: string[] = []

	protected constructor(private readonly from: PipelineNodeAsable<T>, ...uniform: string[]) {
		super(from)
		this.name = uniform
	}

	and(...node: PipelineNode[]): PipelineBarrierNode {
		return this.from.and(...node)
	}

	protected getOutputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return (<PipelineAsNode>this.from).getTargetTextures().map(
			(tex, idx) => { return { texture: tex, alias: this.name[idx] } })
	}
}

export class PipelineOutNode<T = any> extends PipelineNodeBase<T> {

	private node: PostStage

	protected constructor(private readonly from: PipelineNodeAsable, private readonly channel = 0) {
		super(from)
		this.node = new PostStage({
			fragmentShader: `void main() { vec2 tex = gl_FragCoord.xy / iResolution;
					gl_FragColor = texture2D(iChannel[${channel}], tex); }`
		})
	}

	render(source: T, renderer: THREE.WebGLRenderer) {
		const opt: RenderOptions = {
			iChannel: this.getInputChannels()
		}
		this.node.render(Object.assign({}, source, opt), renderer)
		super.render(source, renderer)
	}
}

export class PipelineNode<T = any> extends PipelineNodeAsable<T> {

	private readonly _getTargetTextures: () => THREE.Texture[]
	private isEffectNode = false

	private readonly uniforms = {}

	set target(val: THREE.WebGLRenderTarget | undefined) {
		if (!this.isEffectNode) {
			this._target = val
		}
	}

	protected constructor(prev: PipelineNodeBase,
		private readonly node: Renderable,
		private _target?: THREE.WebGLRenderTarget) {

		super(prev)

		const effect = <Effect>node
		if (this.isEffectNode = effect.isEffect) {
			this._getTargetTextures = () => effect.textures
		} else {
			this._getTargetTextures = () => [this._target!.texture]
		}
	}

	and(...node: PipelineNode[]): PipelineBarrierNode {
		const barrier = new (<any>PipelineBarrierNode)(this)
		barrier.and(...node)
		return barrier
	}

	set(uniforms: { [key: string]: any }): this {
		Object.assign(this.uniforms, uniforms)
		return this
	}

	render(source: T, renderer: THREE.WebGLRenderer) {
		if (!this.isEffectNode && !this._target) {
			const { width, height } = renderer.getSize()
			this._target = new THREE.WebGLRenderTarget(width, height, gBuffer)
		}
		const opt: RenderOptions = {
			iChannel: this.getInputChannels(),
			target: this._target
		}
		const x = Object.assign({ uniforms: {} }, source, opt)
		Object.assign(x.uniforms, this.uniforms)
		// console.log(x.iChannel[0], this._target.texture)
		this.node.render(x, renderer)
		super.render(source, renderer)
	}

	protected getTargetTextures() {
		return this._getTargetTextures()
	}
}

export class PipelineOriginNode<T = any> extends PipelineNodeBase<T> {

	constructor() { super() }

	render(source: T, renderer: THREE.WebGLRenderer) {
		this.reset(); super.render(source, renderer)
	}
}

export class PipelineBarrierNode<T = any> extends PipelineNodeAsable<T> {

	protected barrier: PipelineNode[] = []
	protected ok = 0

	protected constructor(prev: PipelineNode) {
		super(prev)
		this.and(prev)
	}

	and(...node: PipelineNode[]): PipelineBarrierNode {
		this.barrier.push(...node)
		for (const n of node) (<any>n).next.push(this)
		return this
	}

	protected getTargetTextures(): THREE.Texture[] {
		let res: THREE.Texture[] = []
		this.barrier.forEach((bar, idx) => {
			res = res.concat((<PipelineBarrierNode><any>bar).getTargetTextures())
		})
		return res
	}

	protected reset() { this.ok = this.barrier.length; super.reset() }

	protected render(source: T, renderer: THREE.WebGLRenderer) {
		if (--this.ok == 0) super.render(source, renderer)
	}
}

export class Pipeline {

	private effects: Effect[] = []
	private ta: THREE.WebGLRenderTarget
	private tb: THREE.WebGLRenderTarget

	public readonly begin = new PipelineOriginNode()

	get target() { return this.tb }

	constructor(public readonly renderer: THREE.WebGLRenderer) {
		const { width, height } = renderer.getSize()
		this.ta = new THREE.WebGLRenderTarget(width, height)
		this.tb = this.ta.clone()
	}

	render() { this.begin.render({}, this.renderer) }
}

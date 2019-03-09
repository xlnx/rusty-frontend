import * as THREE from "three"
import { Stage, Renderable, RenderOptions, PostStage } from "./stage";

const gBuffer: THREE.WebGLRenderTargetOptions = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.FloatType,
	stencilBuffer: false
}

interface TextureInfo {
	texture: THREE.Texture,
	alias?: string
}

export abstract class Effect<T = any> implements Renderable<T> {

	public readonly isEffect = true

	public readonly textures: THREE.Texture[] = []

	protected readonly begin = new PipelineOriginNode()

	render(source: T & RenderOptions, renderer: THREE.WebGLRenderer) {
		this.begin.render(source, renderer)
	}
}

abstract class PipelineNodeBase<T=any> {

	public readonly isPipelineNode = true

	protected next: PipelineNodeBase[] = []

	constructor(protected readonly prev?: PipelineNodeBase) { }

	protected add<X extends PipelineNodeBase<T>>(e: X): X {
		this.next.push(e); return e
	}

	then(what: Renderable, target?: THREE.WebGLRenderTarget): PipelineNode {
		return this.add(new PipelineNode(this, what, target))
	}

	protected reset() { for (const x of this.next) x.reset() }

	protected render(source: T, renderer: THREE.WebGLRenderer) {
		for (const node of this.next) node.render(source, renderer)
	}

	protected getOutputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return []
	}

	protected getInputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return this.prev!.getOutputChannels()
	}
}

abstract class PipelineNodeAsable<T=any> extends PipelineNodeBase<T> {

	as(...uniform: string[]): PipelineAsNode {
		return this.add(new PipelineAsNode(this, ...uniform))
	}

	abstract and(...node: PipelineNode[]): PipelineBarrierNode

	protected getTargetTextures(): THREE.Texture[] {
		return []
	}

	out(channel: number = 0) {
		return this.add(new PipelineOutNode<T>(this, channel))
	}

	protected getOutputChannels(): { texture: THREE.Texture, alias?: string }[] {
		return this.getTargetTextures().map((tex, idx) => { return { texture: tex } })
	}
}

class PipelineAsNode<T=any> extends PipelineNodeAsable<T> {

	protected name: string[] = []

	constructor(private readonly from: PipelineNodeAsable<T>, ...uniform: string[]) {
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

class PipelineOutNode<T=any> extends PipelineNodeBase<T> {

	private node: PostStage

	constructor(private readonly from: PipelineNodeAsable, private readonly channel = 0) {
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

class PipelineNode<T=any> extends PipelineNodeAsable<T> {

	private readonly _getTargetTextures: () => THREE.Texture[]
	private isEffectNode = false

	private readonly uniforms = {}

	constructor(prev: PipelineNodeBase,
		private readonly node: Renderable,
		private target?: THREE.WebGLRenderTarget) {

		super(prev)

		const effect = <Effect>node
		if (this.isEffectNode = effect.isEffect) {
			this._getTargetTextures = () => effect.textures
		} else {
			this._getTargetTextures = () => [this.target!.texture]
		}
	}

	and(...node: PipelineNode[]): PipelineBarrierNode {
		const barrier = new PipelineBarrierNode(this)
		barrier.and(...node)
		return barrier
	}

	set(uniforms: { [key: string]: any }): this {
		Object.assign(this.uniforms, uniforms)
		return this
	}

	render(source: T, renderer: THREE.WebGLRenderer) {
		if (!this.isEffectNode && !this.target) {
			const { width, height } = renderer.getSize()
			this.target = new THREE.WebGLRenderTarget(width, height, gBuffer)
		}
		const opt: RenderOptions = {
			iChannel: this.getInputChannels(),
			target: this.target
		}
		const x = Object.assign({ uniforms: {} }, source, opt)
		Object.assign(x.uniforms, this.uniforms)
		this.node.render(x, renderer)
		super.render(source, renderer)
	}

	protected getTargetTextures() {
		return this._getTargetTextures()
	}
}

class PipelineOriginNode<T=any> extends PipelineNodeBase<T> {

	constructor() { super() }

	render(source: T, renderer: THREE.WebGLRenderer) {
		this.reset(); super.render(source, renderer)
	}
}

class PipelineBarrierNode<T=any> extends PipelineNodeAsable<T> {

	protected barrier: PipelineNode[] = []
	protected ok = 0

	constructor(prev: PipelineNode) {
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

// class PipelineNode {

// 	// outgoing edges
// 	protected next: PipelineNode[] = []
// 	protected name: string[] = []

// 	constructor(protected readonly prev?: PipelineNode,
// 		public readonly effect?: Effect) { }

// 	and(...node: PipelineNode[]): PipelineBarrierNode {
// 		const barrier = new PipelineBarrierNode(this)
// 		return barrier.and(...node)
// 	}

// 	set(obj: { [key: string]: any }) {

// 	}

// 	out(): this {
// 		if (this.effect) (<any>this.effect).renderToScreen = true;
// 		return this
// 	}

// 	protected input(): TextureInfo[] {
// 		if (this.prev) {
// 			return this.prev.effect ? [{
// 				texture: this.prev.effect!.target.texture,
// 				alias: this.prev.name[0]
// 			}] : this.prev.input()
// 		} else {
// 			return []
// 		}
// 	}

// 	protected reset() { for (const node of this.next) node.reset() }

// 	protected render(renderer: THREE.WebGLRenderer) {
// 		!this.effect || this.effect.render(this.input(), renderer)
// 		for (const node of this.next) node.render(renderer)
// 	}
// }

// class PipelineOriginNode extends PipelineNode {
// 	render(renderer: THREE.WebGLRenderer) {
// 		super.reset(); super.render(renderer)
// 	}
// }

// class PipelineBarrierNode extends PipelineNode {

// 	protected barrier: PipelineNode[] = []
// 	protected ok = 0

// 	constructor(prev: PipelineNode) {
// 		super(prev)
// 		this.and(prev)
// 	}

// 	and(...node: PipelineNode[]): PipelineBarrierNode {
// 		this.barrier.push(...node)
// 		for (const n of node) (<any>n).next.push(this)
// 		return this
// 	}

// 	protected input(): TextureInfo[] {
// 		return this.barrier.map((bar, idx) => bar.effect ? {
// 			texture: bar.effect!.target.texture,
// 			alias: this.name[idx]
// 		} : { texture: <any>undefined })
// 	}

// 	protected reset() { this.ok = this.barrier.length; super.reset() }

// 	protected render(renderer: THREE.WebGLRenderer) {
// 		if (--this.ok == 0) super.render(renderer)
// 	}
// }

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
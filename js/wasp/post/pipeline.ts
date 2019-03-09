import * as THREE from "three"
import { Stage } from "./stage";

const gBuffer: THREE.WebGLRenderTargetOptions = {
	minFilter: THREE.LinearFilter,
	magFilter: THREE.LinearFilter,
	type: THREE.FloatType,
	stencilBuffer: false
}

export class Effect {

	public readonly isEffect = true

	private renderToScreen = false

	private stages: Stage[] = []
	private ta?: THREE.WebGLRenderTarget
	private tb?: THREE.WebGLRenderTarget

	get target() { return this.tb! }

	constructor(target?: THREE.WebGLRenderTarget) {
		if (target) {
			this.ta = target.clone()
			this.tb = target.clone()
		}
	}

	addStage(...stage: Stage[]): this {
		this.stages.push(...stage)
		return this
	}

	render(source: THREE.Texture[], renderer: THREE.WebGLRenderer) {
		if (!this.ta) {
			const { width, height } = renderer.getSize()
			this.ta = new THREE.WebGLRenderTarget(width, height, gBuffer)
			this.tb = this.ta.clone()
		}
		this.stages.forEach((p, idx) => {
			const [ta, tb] = [this.tb, this.ta]
			if (idx != 0) source = [ta!.texture]
			if (idx == this.stages.length - 1 &&
				this.renderToScreen) {
				p.render(source, renderer)
			} else {
				p.render(source, renderer, tb)
				this.tb = tb; this.ta = ta
			}
		})
	}
}

class PipelineNode {

	// outgoing edges
	protected next: PipelineNode[] = []

	constructor(protected readonly pipeline: Pipeline,
		protected readonly prev?: PipelineNode,
		public readonly effect?: Effect) { }

	then(effect: Effect | Stage): PipelineNode {
		const eff = <Effect>effect
		const node = new PipelineNode(this.pipeline, this,
			eff.isEffect ? eff : new Effect().addStage(<Stage><any>eff))
		this.next.push(node)
		return node
	}

	and(...node: PipelineNode[]): PipelineBarrierNode {
		const barrier = new PipelineBarrierNode(this.pipeline, this)
		barrier.addBarrier(...node)
		return barrier
	}

	out(): this { if (this.effect) (<any>this.effect).renderToScreen = true; return this }

	protected input(): THREE.Texture[] {
		if (this.prev) {
			return this.prev.effect ? [this.prev.effect!.target.texture] : this.prev.input()
		} else {
			return []
		}
	}

	protected reset() { for (const node of this.next) node.reset() }

	protected render() {
		!this.effect || this.effect.render(this.input(), this.pipeline.renderer)
		for (const node of this.next) node.render()
	}
}

class PipelineOriginNode extends PipelineNode {
	render() { super.reset(); super.render() }
}

class PipelineBarrierNode extends PipelineNode {

	protected barrier: PipelineNode[] = []
	protected ok = 0

	constructor(pipeline: Pipeline, prev: PipelineNode) {
		super(pipeline, prev)
		this.addBarrier(prev)
	}

	addBarrier(...node: PipelineNode[]) { this.barrier.push(...node) }

	protected input(): THREE.Texture[] {
		const f = bar => bar.effect ? bar.effect!.texture : bar.input()
		return this.barrier.map(f)
	}

	protected reset() { this.ok = this.barrier.length; super.reset() }

	protected render() { if (--this.ok == 0) super.render() }
}

export class Pipeline {

	private effects: Effect[] = []
	private ta: THREE.WebGLRenderTarget
	private tb: THREE.WebGLRenderTarget

	public readonly begin = new PipelineOriginNode(this)

	get target() { return this.tb }

	constructor(public readonly renderer: THREE.WebGLRenderer) {
		const { width, height } = renderer.getSize()
		this.ta = new THREE.WebGLRenderTarget(width, height)
		this.tb = this.ta.clone()
	}

	render() { this.begin.render() }
}
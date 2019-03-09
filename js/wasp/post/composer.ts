import { Stage } from "./stage";
import { WebGLRenderTarget } from "three";

export class Pipeline {

	private passes: Stage[] = []
	private ta: WebGLRenderTarget
	private tb: WebGLRenderTarget

	get target() { return this.tb }

	constructor(private readonly renderer: THREE.WebGLRenderer) {
		const { width, height } = renderer.getSize()
		this.ta = new WebGLRenderTarget(width, height)
		this.tb = this.ta.clone()
	}

	addPass(pass: Stage) {
		this.passes.push(pass)
	}

	render() {
		this.passes.forEach(p => {
			const [ta, tb] = [this.tb, this.ta]
			if (p.renderToScreen) {
				p.render(ta.texture, this.renderer)
			} else {
				p.render(ta.texture, this.renderer, tb)
				this.tb = tb; this.ta = ta
			}
		})
	}
}
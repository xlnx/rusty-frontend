import * as THREE from "three"
import { Pipeline, Prefab, PostStage, PipelineNode } from "../post";

export interface TerrianGeneratorOptions {
	target: THREE.WebGLRenderTarget,
	scale?: number
}

export class TerrianGenerator {

	private readonly pipeline: Pipeline
	private readonly output: PipelineNode
	private readonly scale = Prefab.ScaleShader()

	constructor(private readonly renderer: THREE.WebGLRenderer) {
		this.pipeline = new Pipeline(renderer)
		this.output = this.pipeline.begin
			.then(Prefab.PerlinShader)
			.as("perlin")
			.then(new PostStage({
				fragmentShader: `
void main()
{
	vec2 tex = gl_FragCoord.xy / iResolution;

	vec4 texel = texture2D(iChannel[0], tex);
	const float th = .1;
	texel = (max(texel, vec4(th)) - th) * (1. - th);

	gl_FragColor = texel * 2.;
}
			`
			}))
			.then(this.scale)
	}

	generate(options: TerrianGeneratorOptions) {
		const c = options.scale || 1
		this.scale.set("scale", new THREE.Vector4(c, c, c, c))

		this.output.target = options.target
		this.pipeline.render()
		this.output.target = undefined
	}
}
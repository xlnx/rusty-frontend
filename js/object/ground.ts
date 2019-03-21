import * as THREE from "three"
import { DistUnit, ObjectTag, CityLayer } from "../asset/def";
import { world2plain } from "../object/trans";
import { Thing, Layer, TexAsset, Pipeline, Prefab, PostStage } from "../wasp";
import { LODPlane } from "./lodPlane";
import { PlaneGeometry } from "three";

const grid = 300
const resolution = 256
const seg = 8

// .as("perlin")

// const geometry = new LODPlane(3, w * DistUnit)
// 	.rotateX(-Math.PI / 2)
// 	.translate(0, -1e-4, 0)

// 		const pl = new Pipeline(this.renderer)
// 		pl.begin
// 			.then(Prefab.PerlinShader)
// 			.as("perlin")
// 			.then(new PostStage({
// 				fragmentShader: `
// void main()
// {
// 	vec2 tex = gl_FragCoord.xy / iResolution;

// 	vec4 texel = texture2D(iChannel[0], tex);
// 	const float th = .1;
// 	texel = (max(texel, vec4(th)) - th) * (1. - th);

// 	gl_FragColor = texel * 2.;
// }
// 			`}), this.displacement)
// 		pl.render()

// let meshMaterial = new THREE.MeshStandardMaterial({
// 	color: 0x666666,
// 	wireframe: true,
// 	displacementMap: this.displacement.texture,
// 	displacementScale: .5
// })
// const object = new THREE.Mesh(geometry, meshMaterial)


// 				const mat = new THREE.ShaderMaterial({
// 					vertexShader: `
// varying vec2 vuv;
// void main() {
// 	gl_Position = projectionMatrix * 
// 		modelViewMatrix * 
// 		vec4( position + normal * 0.1, 1 );
// 	vuv = uv;
// }
// 					`,
// 					fragmentShader: `
// varying vec2 vuv;
// void main() {
// 	gl_FragColor = vec4(vuv, 0., 1.);
// }
// 					`
// 				})


export default class Ground extends Thing<ObjectTag> {

	private raycaster = new THREE.Raycaster()

	private readonly object: THREE.Mesh
	// private readonly geometryProto: THREE.BufferGeometry
	private readonly geometry: THREE.BufferGeometry

	private readonly pipeline: Pipeline

	private readonly uniforms = {
		w0: { type: "f", value: 0 },
		scale: { type: "f", value: 1 },
		prev: { type: "t", value: <THREE.Texture><any>undefined },
		wc: { type: "f2", value: <THREE.Vector2><any>undefined },
		r: { type: "f", value: 0 }
	}
	private readonly lodTargets: THREE.WebGLRenderTarget[] = []
	private readonly output
	private readonly w0

	constructor(private readonly renderer: THREE.WebGLRenderer,
		private readonly w: number) {

		super()

		const w0 = w / seg
		this.w0 = this.uniforms.w0.value = w0

		const gs = new Array(6).fill(0)
			.map((_, i) => new THREE.PlaneGeometry(w0, w0, 1 << (7 - i), 1 << (7 - i))
				.scale(DistUnit, DistUnit, DistUnit)
				.rotateX(-Math.PI / 2))
		this.view.addToLayer(CityLayer.Origin, ...new Array(seg * seg).fill(0)
			.map((_, i) => {
				const target = new THREE.WebGLRenderTarget(resolution, resolution, {
					wrapS: THREE.ClampToEdgeWrapping,
					wrapT: THREE.ClampToEdgeWrapping,
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					type: THREE.FloatType,
					stencilBuffer: false,
					depthBuffer: false
				})
				this.lodTargets[i] = target
				const mat = new THREE.MeshStandardMaterial({
					color: 0x666666,
					wireframe: true,
					displacementMap: target.texture
				})

				const lod = new THREE.LOD()
				gs.forEach((g, j) => {
					const d = j * w * DistUnit / 8
					lod.addLevel(new THREE.Mesh(g, mat), d)
				})
				const x = (Math.floor(i % seg) - seg / 2 + .5) * DistUnit
				const y = (seg / 2 - .5 - Math.floor(i / seg)) * DistUnit
				return lod.translateX(w0 * x).translateZ(w0 * y)
			}))

		this.geometry = new THREE.PlaneBufferGeometry(w, w, grid, grid)
			.scale(DistUnit, DistUnit, DistUnit)
			.rotateX(-Math.PI / 2)
			.translate(0, -1e-4, 0)
		this.object = new THREE.Mesh(this.geometry, new THREE.MeshStandardMaterial({
			color: 0x0000ff,
			wireframe: true
		}))
		this.view.addToLayer(CityLayer.Origin, this.object)
		this.object.visible = false

		this.pipeline = new Pipeline(renderer)
		this.output = this.pipeline.begin
			.then(new PostStage({
				uniforms: this.uniforms,
				fragmentShader: `
uniform sampler2D prev;
uniform vec2 wc;
uniform float w0;
uniform float scale;
uniform float r;
void main()
{
	vec2 tex = gl_FragCoord.xy / iResolution;
	vec2 wp = tex * w0;

	float d = length(wp - wc);
	vec4 texel = texture2D(prev, tex);

	if (d < r) {
		float gaussian = exp(-d*d/8.);
		gl_FragColor = texel + gaussian * scale;
	} else {
		gl_FragColor = texel;
	}
}
			`}))
			.then(Prefab.CopyShader)
	}

	adjustHeight(pt: THREE.Vector2, dt: number) {

		const dst = <THREE.BufferAttribute>this.geometry.getAttribute("position")
		const arr = (<number[]>dst.array)

		const radius = 8
		const speed = 10 * DistUnit
		const scale = speed * dt * 1e-3

		let wp = pt.addScalar(this.w / 2)
		const { x: x0, y: y0 } = pt.clone()
			.divideScalar(this.w0)
			.floor()

		for (const dx of [-1, 0, 1]) {
			for (const dy of [-1, 0, 1]) {

				const [x, y] = [x0 + dx, y0 + dy]
				if (!(x >= 0 && y >= 0 && x < seg && y < seg)) continue

				const orig = new THREE.Vector2(x, y).multiplyScalar(this.w0)
				const wc = wp.clone().sub(orig)

				console.log(x, y)

				const minp = wc.clone().subScalar(radius + 1)
					.min(new THREE.Vector2(this.w0, this.w0))
					.max(new THREE.Vector2(0, 0))
					.multiplyScalar(resolution / this.w0)
					.floor()
				const maxp = wc.clone().addScalar(radius + 1)
					.max(new THREE.Vector2(0, 0))
					.min(new THREE.Vector2(this.w0, this.w0))
					.multiplyScalar(resolution / this.w0)
					.ceil()
				const dist = maxp.clone().sub(minp)

				if (!dist.x || !dist.y) continue

				// console.log(x, y)

				this.renderer.setViewport(minp.x, minp.y, dist.x, dist.y)

				const target = this.lodTargets[x + seg * y]

				this.output.target = target
				this.uniforms.prev.value = target.texture
				this.uniforms.wc.value = wc
				this.uniforms.scale.value = scale
				this.uniforms.r.value = radius
				this.pipeline.render()

				const buffer = new Float32Array(dist.x * dist.y * 4)

				this.renderer.readRenderTargetPixels(target,
					minp.x, minp.y, dist.x, dist.y, buffer)

				// console.log(buffer)

				const sample = (uv: THREE.Vector2) => {
					const xy = uv.clone()
						.multiplyScalar(resolution)
						.sub(minp)
					// interpolate
					return buffer[4 * (xy.x + xy.y * dist.x) + 0]
				}

				// for (let i = p.x - r; i < p.x + r; ++i) {
				// 	if (i >= fl(p.x, l) && i < fl(p.x, l) + l) {
				// 		for (let j = p.y - r; j < p.y + r; ++j) {
				// 			if (j >= fl(p.y, l) && j < fl(p.y, l) + l) {
				// 				const d = new THREE.Vector2(i, j).sub(ptx).length() * dpg
				// 				const h = gaussian(d)
				// 				arr[3 * (l * (l - j - 1) + i) + 1] += h * scale
				// 				// console.log(src.array[3 * (l * j + i)])
				// 			}
				// 		}
				// 	}
				// }
				// console.log("update")
			}
		}

		this.renderer.setViewport(0, 0,
			this.renderer.getSize().width, this.renderer.getSize().height)

		// dst.needsUpdate = true
	}

	intersect(coord: { x: number, y: number }, camera: THREE.Camera): THREE.Vector2 | undefined {
		this.raycaster.setFromCamera(coord, camera)
		this.object.visible = true
		const ints = this.raycaster.intersectObject(this.object)
		this.object.visible = false
		if (!ints.length) return undefined
		return world2plain(ints[0].point)
	}

	updateLOD(camera: THREE.Camera) {
		this.view.traverse(e => {
			if (e instanceof THREE.LOD) {
				e.update(camera)
			}
		})
	}

}
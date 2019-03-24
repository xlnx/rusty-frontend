import * as THREE from "three"
import { DistUnit, ObjectTag, CityLayer } from "../asset/def";
import { world2plain } from "../object/trans";
import { Thing, Layer, TexAsset, Pipeline, Prefab, PostStage, TerrianGenerator } from "../wasp";
import * as heightMapShader from "./heightMap.frag"
import * as heightMapCopyShader from "./heightMapCopy.frag"
import { LODPlane } from "./lodPlane";

const grid = 300
const resolution = 2048
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
	// private readonly normalPipeline: Pipeline

	private readonly lodTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		type: THREE.FloatType,
		stencilBuffer: false,
		depthBuffer: false
	})
	private readonly normalTarget = this.lodTarget.clone()
	private readonly uniforms = {
		w: { type: "f", value: 0 },
		scale: { type: "f", value: 1 },
		prev: { type: "t", value: this.lodTarget.texture },
		wc: { type: "f2", value: <THREE.Vector2><any>undefined },
		r: { type: "f", value: 0 }
	}

	constructor(private readonly renderer: THREE.WebGLRenderer,
		private readonly w: number) {

		super()

		this.uniforms.w.value = w
		const w0 = w / seg

		const gs = new Array(5).fill(0)
			.map((_, i) => new THREE.PlaneBufferGeometry(w0, w0, 1 << (6 - i), 1 << (6 - i))
				.scale(DistUnit, DistUnit, DistUnit)
				.rotateX(-Math.PI / 2))
		const mat = new THREE.MeshPhysicalMaterial({
			color: 0x2194ce,
			// wireframe: true,
			roughness: 0.9,
			metalness: 0.2,
			reflectivity: 0.2,
			displacementMap: this.lodTarget.texture,
			displacementScale: DistUnit,
			// normalMap: this.normalTarget.texture,
			flatShading: true
		})
		this.view.addToLayer(CityLayer.Origin, ...new Array(seg * seg).fill(0)
			.map((_, i) => {
				const lod = new THREE.LOD()
				const ix = Math.floor(i % seg)
				const iy = Math.floor(i / seg)
				gs.forEach((g, j) => {
					const d = j * w * DistUnit / 8
					const g0 = g.clone()
					const uv = <THREE.BufferAttribute>g0.getAttribute("uv")
					const arr = <number[]>uv.array

					for (let i = 0; i < arr.length; ++i) {
						arr[i] = arr[i] / seg + (i & 1 ? iy / seg : ix / seg)
					}

					uv.needsUpdate = true
					const m1 = mat.clone()
					m1.wireframe = true
					// m1.wireframeLinewidth = 5
					lod.addLevel(new THREE.Object3D()
						.add(
							new THREE.Mesh(g0, mat),
							// new THREE.Mesh(g0, m1)
						), d)
				})
				const x = (ix - seg / 2 + .5) * DistUnit
				const y = (seg / 2 - .5 - iy) * DistUnit
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
		this.pipeline.begin
			.then(new PostStage({
				uniforms: this.uniforms,
				fragmentShader: heightMapShader
			}))
			.then(new PostStage({
				uniforms: this.uniforms,
				fragmentShader: heightMapCopyShader
			}), this.lodTarget)

		// this.normalPipeline = new Pipeline(renderer)
		// this.normalPipeline.begin
		// 	.then(new PostStage({
		// 		uniforms: this.uniforms,
		// 		fragmentShader: `
		// 		uniform float w;
		// 		uniform sampler2D prev;
		// 		void main() { 
		// 			vec2 c = gl_FragCoord.xy / iResolution;
		// 			vec2 ne = (gl_FragCoord.xy + vec2(1, 1)) / iResolution;
		// 			vec2 nw = (gl_FragCoord.xy + vec2(-1, 1)) / iResolution;
		// 			float d = w / iResolution.x;

		// 			float hc = texture2D(prev, c).x;
		// 			float hne = texture2D(prev, ne).x;
		// 			float hnw = texture2D(prev, nw).x;

		// 			vec3 vne = vec3(d, d, hne - hc);
		// 			vec3 vnw = vec3(-d, d, hnw - hc);
		// 			vec3 n = normalize(cross(vne, vnw));

		// 			gl_FragColor = vec4(n, 0) * .5 + .5;
		// 			// gl_FragColor = vec4(0,texture2D(prev, tex), 0) * .5 + .5; 
		// 		}`
		// 	}), this.normalTarget)

		new TerrianGenerator(this.renderer).generate({
			target: this.lodTarget,
			scale: 5 * 1 / DistUnit
		})
		this.updateWireframe(0, 0, grid, grid)
		// this.updateNormal()
	}

	getHeight(pt: THREE.Vector2[]) {
		const pscr = pt.map(p => p.clone()
			.addScalar(this.w / 2)
			.divideScalar(this.w)
			.multiplyScalar(resolution)
			.floor()
		)
		// console.log(pt)
		const minp = pscr[0].clone()
		pscr.forEach(p => minp.min(p))
		const maxp = pscr[0].clone()
		pscr.forEach(p => maxp.max(p))
		maxp.addScalar(1)

		// console.log(minp, maxp)

		const rect = new THREE.Vector4(
			minp.x, minp.y, maxp.x - minp.x, maxp.y - minp.y)

		// interpolate

		const buffer = new Float32Array(4 * rect.z * rect.w)
		this.renderer.readRenderTargetPixels(this.lodTarget,
			rect.x, rect.y, rect.z, rect.w, buffer)

		const res = pscr.map(p => {
			const { x, y } = p.sub(minp)
			// console.log(x, y)
			return buffer[4 * (x + y * rect.z)]
		})
		// console.log(res)
		return res
	}

	// private updateNormal() {
	// 	this.normalPipeline.render()
	// }

	private updateWireframe(x: number, y: number, width: number, height: number) {

		if (height <= 0 || width <= 0) return

		const l = grid + 1
		const minp = new THREE.Vector2(x, y)
			.divideScalar(grid)
			.multiplyScalar(resolution)
			.floor()
			.max(new THREE.Vector2(0, 0))
			.min(new THREE.Vector2(resolution - 1, resolution - 1))
		const maxp = new THREE.Vector2(x + width, y + height)
			.divideScalar(grid)
			.multiplyScalar(resolution)
			.ceil()
			.max(new THREE.Vector2(0, 0))
			.min(new THREE.Vector2(resolution - 1, resolution - 1))
		const dist = maxp.clone().sub(minp)

		const buffer = new Float32Array(dist.x * dist.y * 4)

		this.renderer.readRenderTargetPixels(this.lodTarget,
			minp.x, minp.y, dist.x, dist.y, buffer)

		const sample = (uv: THREE.Vector2) => {
			const xy = uv.clone()
				.multiplyScalar(resolution)
				.sub(minp)
				// interpolate
				.floor()
			const ok = xy.x >= 0 && xy.y >= 0 &&
				xy.x < dist.x && xy.y < dist.y
			return {
				h: buffer[4 * (xy.x + xy.y * dist.x) + 0],
				ok: ok
			}
		}

		const dst = <THREE.BufferAttribute>this.geometry.getAttribute("position")
		const arr = (<number[]>dst.array)

		for (let i = x; i < x + width; ++i) {
			if (i >= 0 && i < l) {
				for (let j = y; j < y + height; ++j) {
					if (j >= 0 && j < l) {
						const uv = new THREE.Vector2(i, j).divideScalar(grid)
						// const d = new THREE.Vector2(i, j).sub(ptx).length() * dpg
						const { h, ok } = sample(uv)
						if (ok) {
							arr[3 * (l * (l - j - 1) + i) + 1] = h * DistUnit
						}
						// console.log(src.array[3 * (l * j + i)])
					}
				}
			}
		}

		dst.needsUpdate = true
	}

	adjustHeight(pt: THREE.Vector2, dt: number) {

		const radius = 8
		const speed = 10
		const scale = speed * dt * 1e-3

		let wp = pt.clone()
			.addScalar(this.w / 2)

		const minp = wp.clone().subScalar(radius + 1)
			.min(new THREE.Vector2(this.w, this.w))
			.max(new THREE.Vector2(0, 0))
			.multiplyScalar(resolution / this.w)
			.floor()
		const maxp = wp.clone().addScalar(radius + 1)
			.min(new THREE.Vector2(this.w, this.w))
			.max(new THREE.Vector2(0, 0))
			.multiplyScalar(resolution / this.w)
			.ceil()
		const dist = maxp.clone().sub(minp)

		if (!dist.x || !dist.y) return

		// this.renderer.setViewport(minp.x, minp.y, dist.x, dist.y)

		this.uniforms.wc.value = wp
		this.uniforms.scale.value = scale
		this.uniforms.r.value = radius
		this.pipeline.render()

		// this.renderer.setViewport(0, 0,
		// 	this.renderer.getSize().width, this.renderer.getSize().height)

		const p = wp.clone()
			.divideScalar(this.w)
			.multiplyScalar(grid)
			.floor()
		const r = Math.ceil(radius / this.w * grid + 1)

		this.updateWireframe(p.x - r, p.y - r, 2 * r + 1, 2 * r + 1)
		// this.updateNormal()

		// console.log(this.getHeight(pt))
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
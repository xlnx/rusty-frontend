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

	private readonly lodTarget = new THREE.WebGLRenderTarget(resolution, resolution, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		type: THREE.FloatType,
		stencilBuffer: false,
		depthBuffer: false
	})
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

		const gs = new Array(6).fill(0)
			.map((_, i) => new THREE.PlaneBufferGeometry(w0, w0, 1 << (7 - i), 1 << (7 - i))
				.scale(DistUnit, DistUnit, DistUnit)
				.rotateX(-Math.PI / 2))
		const mat = new THREE.MeshStandardMaterial({
			color: 0x666666,
			wireframe: true,
			displacementMap: this.lodTarget.texture
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
					lod.addLevel(new THREE.Mesh(g0, mat), d)
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
		// this.object.visible = false

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

		new TerrianGenerator(this.renderer).generate({
			target: this.lodTarget,
			scale: 5
		})
		this.updateWireframe(0, 0, grid, grid)
	}

	getHeight(pt: THREE.Vector2) {

		const p = pt.clone()
			.addScalar(this.w / 2)
			.divideScalar(this.w)
			.multiplyScalar(resolution)
			.floor()
		// interpolate

		const buffer = new Float32Array(4)
		this.renderer.readRenderTargetPixels(this.lodTarget,
			p.x, p.y, 1, 1, buffer)

		return buffer[4 * 0 + 1]
	}

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
							arr[3 * (l * (l - j - 1) + i) + 1] = h
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
		const speed = 10 * DistUnit
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

		// console.log(this.getHeight(pt))
	}

	intersect(coord: { x: number, y: number }, camera: THREE.Camera): THREE.Vector2 | undefined {
		this.raycaster.setFromCamera(coord, camera)
		// this.object.visible = true
		const ints = this.raycaster.intersectObject(this.object)
		// this.object.visible = false
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
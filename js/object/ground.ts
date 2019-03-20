import * as THREE from "three"
import { DistUnit, ObjectTag, CityLayer } from "../asset/def";
import { world2plain } from "../object/trans";
import { Thing, Layer, TexAsset, Pipeline, Prefab, PostStage } from "../wasp";
import { LODPlane } from "./lodPlane";

const grid = 300

export default class Ground extends Thing<ObjectTag> {

	private raycaster = new THREE.Raycaster()

	private readonly object: THREE.Mesh
	private readonly geometryProto: THREE.BufferGeometry
	private readonly geometry: THREE.BufferGeometry

	private readonly pipeline: Pipeline

	private readonly displacement = new THREE.WebGLRenderTarget(512, 512, {
		wrapS: THREE.RepeatWrapping,
		wrapT: THREE.RepeatWrapping,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		type: THREE.FloatType,
		stencilBuffer: false,
		depthBuffer: false
	})

	private readonly

	constructor(private readonly renderer: THREE.WebGLRenderer,
		private readonly w: number) {

		super()

		this.pipeline = new Pipeline(renderer)
		this.pipeline.begin
			.then(new PostStage({
				uniforms: { prev: { value: this.displacement.texture } },
				fragmentShader: `
uniform sampler2D prev;
void main()
{
	vec2 tex = gl_FragCoord.xy / iResolution;

	vec4 texel = texture2D(prev, tex);
	gl_FragColor = texel + .01;
}
			`}))
			.then(Prefab.CopyShader, this.displacement)
		// .as("perlin")

		const geometry = new LODPlane(3, w * DistUnit)
			.rotateX(-Math.PI / 2)
			.translate(0, -1e-4, 0)

		const pl = new Pipeline(this.renderer)
		pl.begin
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
			`}), this.displacement)
		pl.render()

		let meshMaterial = new THREE.MeshStandardMaterial({
			color: 0x666666,
			wireframe: true,
			displacementMap: this.displacement.texture,
			displacementScale: .5
		})
		const object = new THREE.Mesh(geometry, meshMaterial)

		// this.view.addToLayer(CityLayer.Origin, object)

		this.geometryProto = new THREE.PlaneBufferGeometry(w * DistUnit, w * DistUnit,
			grid, grid)
			.rotateX(-Math.PI / 2)
			.translate(0, -1e-4, 0)
		this.geometry = this.geometryProto.clone()
		const mat = meshMaterial.clone()
		// mat.displacementMap = null
		mat.color.set(new THREE.Color(0, 0, 1))
		this.object = new THREE.Mesh(this.geometry, mat)
		// object.visible = false

		this.view.addToLayer(CityLayer.Origin, this.object)
	}

	adjustHeight(pt: THREE.Vector2, dt: number) {
		// , map: THREE.RenderTarget) {
		const radius = 10

		const src = <THREE.BufferAttribute>this.geometryProto.getAttribute("position")
		const dst = <THREE.BufferAttribute>this.geometry.getAttribute("position")
		// this.renderer.set

		const ptx = pt.clone()
			.addScalar(this.w / 2)
			.divideScalar(this.w)
			.multiplyScalar(grid)
		pt = ptx.clone().floor()
		// ptx.addScalar(0.5)

		const dpg = this.w / grid

		console.log(pt.x, pt.y)
		const r = radius + 3, l = grid + 1
		const fl = (x, y) => x - x % y

		const sigma = 2
		const sig2 = 2 * sigma * sigma
		const root = Math.PI * sig2
		const gaussian = x => Math.exp(-x * x / sig2) / root
		// Math.max(1 - x * x * .01, 0)
		const arr = (<number[]>dst.array)

		const speed = 10 * DistUnit

		for (let i = pt.x - r; i < pt.x + r; ++i) {
			if (i >= fl(pt.x, l) && i < fl(pt.x, l) + l) {
				for (let j = pt.y - r; j < pt.y + r; ++j) {
					if (j >= fl(pt.y, l) && j < fl(pt.y, l) + l) {
						const d = new THREE.Vector2(i, j).sub(ptx).length() * dpg
						const h = gaussian(d) * 20
						arr[3 * (l * (l - j - 1) + i) + 1] += h * speed * dt * 1e-3
						// console.log(src.array[3 * (l * j + i)])
					}
				}
			}
		}
		console.log("update")
		dst.needsUpdate = true

		// this.pipeline.render()
	}

	intersect(coord: { x: number, y: number }, camera: THREE.Camera): THREE.Vector2 | undefined {
		this.raycaster.setFromCamera(coord, camera)
		const ints = this.raycaster.intersectObject(this.object)
		if (!ints.length) return undefined
		return world2plain(ints[0].point)
	}

}
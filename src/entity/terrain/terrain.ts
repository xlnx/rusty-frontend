import { Pipeline, PostStage, PipelineNode, Shader, async_foreach } from "../../wasp";

interface TerrainMorphOptions {
	center: THREE.Vector2,
	dt: number,
	radius: number,
	speed: number,
	scale?: number
}

interface Block {
	rect: THREE.Box2,
	barrierRect: THREE.Box2,
	blockId: THREE.Vector2,
	mesh: THREE.Mesh,
	geometry: THREE.BufferGeometry,
	target: THREE.WebGLRenderTarget,
	mask: THREE.WebGLRenderTarget,
}

const Seg = 20
const Resolution = 256
const Barrier = 16
const BarrierScale = (Resolution - Barrier) / Resolution

function getBox2(pt: THREE.Vector2[]) {
	const minp = pt[0].clone()
	pt.forEach(p => minp.min(p))
	const maxp = pt[0].clone()
	pt.forEach(p => maxp.max(p))
	return new THREE.Box2(minp, maxp)
}

function getRelative(rect: THREE.Box2, orig: THREE.Vector2) {
	const { min, max } = rect
	return new THREE.Box2(min.clone().sub(orig), max.clone().sub(orig))
}

export class Terrain extends THREE.Object3D {

	private readonly blocks: Block[] = []

	private readonly morphPipeline: Pipeline
	private readonly morphOutput: PipelineNode

	private readonly commonUniforms = {
		barrierScale: { type: "f", value: 0 },
		worldWidth: { type: "f", value: 0 },
		blockId: { type: "v2", value: new THREE.Vector2() },
		blockDim: { type: "v2", value: new THREE.Vector2() }
	}

	private readonly morphCopyUniforms = Object.assign({
		radius: { type: "f", value: 1 },
		scale: { type: "f", value: 1 },
		center: { type: "v2", value: new THREE.Vector2() },
		mask: { type: "t", value: <THREE.Texture><any>null },
	}, this.commonUniforms)
	private readonly morphUniforms = Object.assign({
		prev: { type: "t", value: <THREE.Texture><any>null },
	}, this.morphCopyUniforms)


	private readonly markPipeline: Pipeline
	private readonly markOutput: PipelineNode

	private readonly markCopyUniforms = Object.assign({
		radius: { type: "f", value: 4 },
		center: { type: "v2", value: new THREE.Vector2() },
		axes: { type: "v4", value: new THREE.Vector4() },
		placeholder: { type: "v2", value: new THREE.Vector2() },
	}, this.commonUniforms)
	private readonly markUniforms = Object.assign({
		prev: { type: "t", value: <THREE.Texture><any>null },
	}, this.markCopyUniforms)

	private readonly buffer = new Float32Array(4 * Resolution * Resolution)
	private readonly rigidContainer = new THREE.Object3D
	private readonly container = new THREE.Object3D

	constructor(
		private readonly el: AFrame.Entity,
		private readonly renderer: THREE.WebGLRenderer,
		private readonly blockCnt: number,
		private readonly worldWidth: number,
		material: THREE.Material) {

		super()

		blockCnt = Math.floor(blockCnt)

		const matWire =
			// new THREE.ShaderMaterial({
			// 	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);}`,
			// 	fragmentShader: `varying vec2 vUv; void main(){gl_FragColor = vec4(vUv, 0, 0);}`
			// })
			new THREE.MeshBasicMaterial({
				color: 0x0000ff,
				wireframe: true
			})

		const g = new THREE.PlaneBufferGeometry(1, 1, Seg, Seg)
			.rotateX(-Math.PI / 2)
		this.processGeometry(g)
		const gs = new Array(4).fill(0)
			.map((_, i) => {
				const geo = new THREE.PlaneBufferGeometry(1, 1, 1 << (7 - i), 1 << (7 - i))
					.rotateX(-Math.PI / 2)
				this.processGeometry(geo)
				return geo
			})

		const t = new THREE.WebGLRenderTarget(Resolution, Resolution, {
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			type: THREE.FloatType,
			stencilBuffer: false,
			depthBuffer: false
		})

		// new TerrianGenerator(renderer).generate()

		async_foreach(Array(blockCnt).fill(0).map((_, i) => i), (y: number) => {
			// for (let y = 0; y < blockCnt; ++y) {

			// async_foreach(Array(blockCnt).fill(0).map((_, i) => i), (x: number) => {
			for (let x = 0; x < blockCnt; ++x) {

				// const fact = worldWidth / blockCnt
				const s = worldWidth / blockCnt
				const scl = (1 + 1e-4) * s
				// const scl = (0.92) * s
				// object.scale.setScalar((1 + 1e-4) * s)
				const adjust = (object: THREE.Object3D) => {
					object.translateX((x + 0.5) * s)
					object.translateZ((-y - 0.5) * s)
				}

				// position.array = copy_f32_array_rs(<Float32Array>position.array)
				const target = t.clone()
				const mask = t.clone()
				const lod = new THREE.LOD()
				const mat = // new THREE.ShaderMaterial({
					// 	uniforms: { heightMap: { value: target.texture } },
					// 	vertexShader: `
					// attribute vec2 heightMapUV;
					// uniform sampler2D heightMap;
					// void main() {
					// 	vec4 heightInfo = texture2D(heightMap, heightMapUV);
					// 	gl_Position = projectionMatrix * modelViewMatrix * 
					// 		vec4(position + vec3(0, heightInfo.x, 0), 1);
					// }`,
					// 	fragmentShader: `void main() {gl_FragColor = vec4(0.1);} `,
					// 	wireframe: true
					// })
					new THREE.MeshPhysicalMaterial({
						color: 0x2194ce,
						wireframe: true,
						transparent: false,
						roughness: 0.9,
						metalness: 0.2,
						reflectivity: 0.2,
						displacementMap: target.texture,
						// displacementScale: DistUnit,
						// normalMap: this.normalTarget.texture,
						flatShading: true
					})
				gs.forEach((cg, j) => {
					const d = j * worldWidth / 200
					// console.log(j, d)
					// const d = j * 10
					const mesh = new THREE.Mesh(cg, mat)
					mesh["el"] = this.el
					mesh.scale.setScalar(scl)
					lod.addLevel(mesh, d)
				})
				adjust(lod)
				this.container.add(lod)

				const geo = g.clone().scale(s, s, s)
				const meshWire = new THREE.Mesh(geo, matWire)
				meshWire["el"] = this.el
				adjust(meshWire)
				this.rigidContainer.add(meshWire)

				const bid = new THREE.Vector2(x, y)
				const min = bid.clone().multiplyScalar(worldWidth / blockCnt)
				const max = bid.clone().addScalar(1).multiplyScalar(worldWidth / blockCnt)
				const mid = min.clone().add(max).divideScalar(2)
				const bmin = mid.clone().add(min.clone().sub(mid).divideScalar(BarrierScale))
				const bmax = mid.clone().add(max.clone().sub(mid).divideScalar(BarrierScale))
				this.blocks.push({
					rect: new THREE.Box2(min, max),
					barrierRect: new THREE.Box2(bmin, bmax),
					blockId: bid,
					mesh: meshWire,
					geometry: geo,
					target: target,
					mask: mask
				})
			}
		})
		// for (let y = 0; y < blockCnt; ++y) {

		// }

		this.container
			.translateX(-0.5 * this.worldWidth)
			.translateZ(0.5 * this.worldWidth)
		// this.initContainer(this.rigidContainer)

		this.add(this.container)
		this.container.add(this.rigidContainer)
		this.rigidContainer.visible = false

		let autoClearColor = renderer.autoClearColor

		this.commonUniforms.blockDim.value = new THREE.Vector2(blockCnt, blockCnt)
		this.commonUniforms.worldWidth.value = worldWidth
		this.commonUniforms.barrierScale.value = BarrierScale

		this.morphPipeline = new Pipeline(renderer)
		this.morphOutput = this.morphPipeline.begin
			.thenExec(() => {
				autoClearColor = renderer.autoClearColor
				renderer.autoClearColor = false
			})
			.then(new PostStage({
				uniforms: this.morphUniforms,
				fragmentShader: require("./shaders/morph.frag")
			}))
			.then(new PostStage({
				uniforms: this.morphCopyUniforms,
				fragmentShader: require("./shaders/morph-copy.frag")
			}))
			.thenExec(() => {
				renderer.autoClearColor = autoClearColor
			})

		this.markPipeline = new Pipeline(renderer)
		this.markOutput = this.markPipeline.begin
			.thenExec(() => {
				autoClearColor = renderer.autoClearColor
				renderer.autoClearColor = false
			})
			.then(new PostStage({
				uniforms: this.markUniforms,
				fragmentShader: require("./shaders/mark.frag")
			}))
			.then(new PostStage({
				uniforms: this.markCopyUniforms,
				fragmentShader: require("./shaders/mark-copy.frag")
			}))
			.thenExec(() => {
				renderer.autoClearColor = autoClearColor
			})
	}

	private processGeometry(g: THREE.BufferGeometry) {
		const uv = <THREE.BufferAttribute>g.getAttribute("uv")
		const uvarr = <Float32Array>uv.array
		const heightmapUV = new THREE.BufferAttribute(
			uvarr.map(x => (x - 0.5) * BarrierScale + 0.5), 2)
		uv.array = uvarr.map(x => (x - 0.5) * BarrierScale + 0.5)
		uv.needsUpdate = true
		g.addAttribute("heightMapUV", heightmapUV)
	}

	private sampleSingleBlock(block: Block, world: THREE.Box2) {

		const ires = Resolution - Barrier
		const zero = new THREE.Vector2
		const resolution = new THREE.Vector2(ires, ires)

		const blockWidth = this.worldWidth / this.blockCnt
		const { min, max } = getRelative(world, block.rect.min)

		min.divideScalar(blockWidth).multiply(resolution)
			.floor().max(zero)
		max.divideScalar(blockWidth).multiply(resolution)
			.ceil().min(resolution)

		const dist = max.clone().sub(min)
		const off = Math.floor(Barrier / 2)
		this.renderer.readRenderTargetPixels(block.target,
			min.x + off, min.y + off, dist.x, dist.y, this.buffer)

		// console.log(min, max)

		return (uv: THREE.Vector2) => {
			const xy = uv.clone()
				.multiply(resolution)
				.sub(min)
				.floor()

			if (xy.x == -1) xy.x = 0
			if (xy.y == -1) xy.y = 0
			if (xy.x == dist.x) xy.x = dist.x - 1
			if (xy.y == dist.y) xy.y = dist.y - 1

			const ok = xy.x >= 0 && xy.y >= 0 &&
				xy.x < dist.x && xy.y < dist.y
			return {
				h: this.buffer[4 * (dist.x * xy.y + xy.x)] * this.worldWidth / this.blockCnt,
				ok: ok
			}
		}
	}

	private world2uv(block: Block, world: THREE.Vector2) {

		return world.clone()
			.divideScalar(this.worldWidth / this.blockCnt)
			.sub(block.blockId.clone())
	}

	morph(opts: TerrainMorphOptions) {

		const { radius, speed, center, dt, scale } = opts

		this.morphUniforms.scale.value = speed * (scale || 1) * dt * 1e-3
		this.morphUniforms.radius.value = radius
		this.morphUniforms.center.value = center
			.addScalar(this.worldWidth / 2)

		const rect = new THREE.Box2(
			center.clone().subScalar(radius),
			center.clone().addScalar(radius)
		)

		this.filterBarrier(rect, block => {

			this.commonUniforms.blockId.value = block.blockId

			this.morphUniforms.mask.value = block.mask.texture
			this.morphUniforms.prev.value = block.target.texture

			this.morphOutput.target = block.target
			// console.log(this.morphUniforms.prev.value, block.target.texture)
			this.morphPipeline.render()
		})

		this.updateWireframe(rect)
	}

	mark(center: THREE.Vector2, angle: number, placeholder: THREE.Vector2) {

		center = center.clone().addScalar(this.worldWidth / 2)

		const orig = new THREE.Vector2()
		const fx = new THREE.Vector2(0, -1).rotateAround(orig, angle)
		const fy = fx.clone().rotateAround(orig, Math.PI / 2)
		const face = new THREE.Vector4(fx.x, fx.y, fy.x, fy.y)
		placeholder = placeholder.clone().divideScalar(2)
		const px = placeholder.clone().rotateAround(orig, angle)
		const py = placeholder.clone().rotateAround(orig, angle + Math.PI / 2)
		if (px.x < 0) px.x = -px.x
		if (px.y < 0) px.y = -px.y
		if (py.x < 0) py.x = -py.x
		if (py.y < 0) py.y = -py.y
		const p = px.max(py)
		const rect = new THREE.Box2(
			center.clone().sub(px), //.subScalar(this.markUniforms.radius.value),
			center.clone().add(px) //.addScalar(this.markUniforms.radius.value)
		)

		this.markCopyUniforms.center.value = center
		this.markCopyUniforms.axes.value = face
		this.markCopyUniforms.placeholder.value = placeholder

		this.filterBarrier(rect, block => {

			this.commonUniforms.blockId.value = block.blockId

			this.markUniforms.prev.value = block.mask.texture

			this.markOutput.target = block.mask

			this.markPipeline.render()
		})

		this.updateWireframe(rect)
	}

	getHeight(pt: THREE.Vector2[]) {

		pt = pt.map(pt => pt.clone().addScalar(this.worldWidth / 2))

		const rect = getBox2(pt)
		const res = pt.map(_ => 0)

		this.filter(rect, block => {
			const irect = rect.clone().intersect(block.rect)
			const mypt = pt
				.map((p, i) => { return { p: p, i: i } })
				.filter(p => irect.containsPoint(p.p))

			if (mypt.length) {
				const sample = this.sampleSingleBlock(block,
					getBox2(mypt.map(p => p.p)))

				for (const pt of mypt) {
					const { h, ok } = sample(this.world2uv(block, pt.p))
					res[pt.i] = h
				}
			}
		})

		return res
	}

	raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): void {
		this.rigidContainer.visible = true
		intersects.push(...raycaster.intersectObject(this.rigidContainer, true))
		this.rigidContainer.visible = false
	}

	coordCast(isect: THREE.Intersection): THREE.Vector2 {
		const { object, point } = isect
		const { x, y, z } = point
		const { x: x1, y: y1, z: z1 } = new THREE.Vector4(x, y, z, 1)
			.applyMatrix4(new THREE.Matrix4().getInverse(this.container.matrixWorld))
		return new THREE.Vector2(x1, -z1).subScalar(this.worldWidth / 2)
	}

	private updateWireframe(rect: THREE.Box2) {

		this.filter(rect, block => {
			const position = <THREE.BufferAttribute>block.geometry.getAttribute("position")
			const arr = <Float32Array>position.array

			const sample = this.sampleSingleBlock(block, rect)

			const l = Seg + 1
			for (let i = 0; i < l; ++i) {
				for (let j = 0; j < l; ++j) {
					const uv = new THREE.Vector2(i, j).divideScalar(Seg)
					const { h, ok } = sample(uv)
					if (ok) {
						arr[3 * (l * (l - j - 1) + i) + 1] = h
					}
				}
			}

			position.needsUpdate = true
		})
	}

	private applyFilter(rect: THREE.Box2, callback: (b: Block) => void) {

		const c0 = new THREE.Vector2(0, 0)
		const c1 = new THREE.Vector2(this.blockCnt, this.blockCnt)
		const blockWidth = this.worldWidth / this.blockCnt
		const min = rect.min.clone().divideScalar(blockWidth)
			.subScalar(1)
			.floor().max(c0).min(c1)
		const max = rect.max.clone().divideScalar(blockWidth)
			.addScalar(1)
			.ceil().max(c0).min(c1)

		for (let y = min.y; y < max.y; ++y) {
			for (let x = min.x; x < max.x; ++x) {
				callback(this.blocks[y * this.blockCnt + x])
			}
		}
	}

	private filterBarrier(rect: THREE.Box2, callback: (b: Block) => void) {

		this.applyFilter(rect, block => {
			if (block.barrierRect.intersectsBox(rect)) {
				callback(block)
			}
		})
	}

	private filter(rect: THREE.Box2, callback: (b: Block) => void) {

		this.applyFilter(rect, block => {
			if (block.rect.intersectsBox(rect)) {
				callback(block)
			}
		})
	}

	updateLOD(camera: THREE.Camera) {
		this.traverse(e => {
			if (e instanceof THREE.LOD) {
				e.update(camera)
			}
		})
	}
}
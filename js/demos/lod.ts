import * as THREEJS from "three"
import * as THREE_ADDONS from "three-addons"
const THREE: typeof import("three") = { ...THREEJS, ...THREE_ADDONS }
import { LayeredView, DirectRenderer, Pipeline, RenderStage, Stage, Effect, PostStage } from "../wasp";
import { loadavg } from "os";
import { Geometry, BufferGeometry, PlaneGeometry, MeshPhongMaterial } from "three";

class FFTWaveEffect extends Effect {

	constructor(width: number = 256) {
		super()

		const target = new THREE.WebGLRenderTarget(width, width, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			type: THREE.FloatType,
			stencilBuffer: false
		})
		this.textures.push(target.texture)

		const phillips = new PostStage({ fragmentShader: require("./shaders/phillips.frag") })
		const gaussian = new PostStage({ fragmentShader: require("./shaders/gaussian.frag") })
		const fftsrcH = new PostStage({
			uniforms: { spectrum: { type: 't' }, gaussian: { type: 't' } },
			fragmentShader: require("./shaders/fftsrcH.frag")
		})
		const fftsrcDxy = new PostStage({
			uniforms: { H: { type: 't' } },
			fragmentShader: require("./shaders/fftsrcDxy.frag")
		})
		const fftvr = new PostStage({
			uniforms: { prev: { type: 't' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/fftvr.frag")
		});
		const fftv = new PostStage({
			uniforms: { prev: { type: 't' }, unit: { type: 'f' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/fftv.frag")
		})
		const ffthr = new PostStage({
			uniforms: { prev: { type: 't' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/ffthr.frag")
		})
		const ffth = new PostStage({
			uniforms: { prev: { type: 't' }, unit: { type: 'f' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/ffth.frag")
		})
		const fftend = new PostStage({
			uniforms: { prevH: { type: 't' }, prevDxy: { type: 't' }, N: { type: 'i', value: width } },
			fragmentShader: require("./shaders/fftend.frag")
		})

		const phillipsNode = this.begin.then(phillips, target.clone())
		const gaussianNode = this.begin.then(gaussian, target.clone())
		const srcH = phillipsNode.and(gaussianNode)
			.as("spectrum", "gaussian")
			.then(fftsrcH, target.clone())
		const srcDxy = srcH.as("H")
			.then(fftsrcDxy, target.clone())

		let h = srcH.as("prev").then(fftvr, target.clone())
		let dxy = srcDxy.as("prev").then(fftvr, target.clone())

		for (let i = 1; i != width; i *= 2) {
			h = h.as("prev").then(fftv, target.clone()).set({ unit: i })
			dxy = dxy.as("prev").then(fftv, target.clone()).set({ unit: i })
		}

		h = h.as("prev").then(ffthr, target.clone())
		dxy = dxy.as("prev").then(ffthr, target.clone())

		for (let i = 1; i != width; i *= 2) {
			h = h.as("prev").then(ffth, target.clone()).set({ unit: i })
			dxy = dxy.as("prev").then(ffth, target.clone()).set({ unit: i })
		}

		const res = h.and(dxy).as("prevH", "prevDxy")
			.then(fftend, target)
	}
}

class testPlane extends BufferGeometry {
	constructor() {
		super();
		let geometry = new THREE.BufferGeometry();
		let indices: Array<any> = [];
		let vertices: Array<any> = [];

		let size = 20;
		let segments = 10;
		let halfSize = size / 2;
		let segmentSize = size / segments;
		// generate vertices, normals and color data for a simple grid geometry
		for (let i = 0; i <= segments; i++) {
			let y = (i * segmentSize) - halfSize;
			for (let j = 0; j <= segments; j++) {
				let x = (j * segmentSize) - halfSize;
				vertices.push(x, - y, 0);

				let r = (x / size) + 0.5;
				let g = (y / size) + 0.5;

			}
		}
		// generate indices (data for element array buffer)
		for (let i = 0; i < segments; i++) {
			for (let j = 0; j < segments; j++) {
				let a = i * (segments + 1) + (j + 1);
				let b = i * (segments + 1) + j;
				let c = (i + 1) * (segments + 1) + j;
				let d = (i + 1) * (segments + 1) + (j + 1);
				// generate two faces (triangles) per iteration
				indices.push(a, b, d); // face one
				indices.push(b, c, d); // face two
			}
		}
		//
		geometry.setIndex(indices);
		const normals = new Array(vertices.length).fill(0).map((_, i) => i % 3 == 2 ? 1 : 0)
		geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
		return geometry
	}
}

class LODPlane extends BufferGeometry {
	constructor(C: number, M: number, w0: number) {
		super()
		let geometry = new THREE.BufferGeometry();
		let indices: Array<any> = [];
		let vertices: Array<any> = [];
		let w = w0;
		let offset = 0;
		let line = M * 2 + 1;
		let e = M;
		let b = M;
		vertices.length = C * (2 * M + 1) * (2 * M + 1) * 2;
		let ipos = 0;
		for (let k = 0; k != C; ++k) {
			for (let i = -M; i <= M; ++i) {
				for (let j = -M; j <= M; ++j) {
					vertices[ipos++] = j * w; vertices[ipos++] = 0; vertices[ipos++] = i * w;
				}
			}
			for (let i = 1; i != line - 2; ++i) {
				for (let j = 1; j != line - 2; ++j) {
					if (i < e || i >= b || j < e || j >= b) {
						let lt = offset + i * line + j;
						indices.push(lt, lt + line + 1, lt + 1,
							lt, lt + line, lt + line + 1);
					}
				}
			}
			for (let j = 2; j < line - 2; j += 2) {
				let lt = offset + 0 * line + j;
				indices.push(lt, lt + line - 1, lt + line,
					lt, lt + line, lt + line + 1,
					lt, lt + 1 + line, lt + 2);
			}
			for (let j = 2; j < line - 2; j += 2) {
				let lt = offset + (line - 1) * line + j;
				indices.push(lt, lt - line, lt - line - 1,
					lt, lt - line + 1, lt - line,
					lt, lt + 2, lt + 1 - line);
			}
			for (let i = 2; i < line - 2; i += 2) {
				let lt = offset + i * line + 0;
				indices.push(lt, lt + 1, lt + 1 - line,
					lt, lt + 1 + line, lt + 1,
					lt, lt + 2 * line, lt + 1 + line);
			}
			for (let i = 2; i < line - 2; i += 2) {
				let lt = offset + i * line + (line - 1);
				indices.push(lt, lt - 1 - line, lt - 1,
					lt, lt - 1, lt - 1 + line,
					lt, lt - 1 + line, lt + 2 * line);
			}

			let lt = offset;
			indices.push(lt, lt + 1 + line, lt + 2,
				lt, lt + 2 * line, lt + 1 + line);
			lt = offset + (line - 1);
			indices.push(lt, lt - 1 + line, lt + 2 * line);
			lt = offset + line * (line - 1);
			indices.push(lt, lt + 2, lt + 1 - line);

			w *= 2;
			offset += (M * 2 + 1) * (M * 2 + 1);
			e = M / 2;
			b = 3 * M / 2;
		}
		geometry.setIndex(indices)
		const normals = new Array(vertices.length).fill(0).map((_, i) => i % 3 == 1 ? 1 : 0)
		const mx = M * w / 2;
		const uvs = vertices.map(e => (e / mx + 1) * .5).filter((_, i) => i % 3 != 1)
		geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
		geometry.addAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
		return geometry;

	}
}

class LODBoundary extends BufferGeometry {
	constructor(M: number, w: number) {
		super();
		let W = w * M / 2;
		let geometry = new THREE.BufferGeometry();
		let indices: Array<any> = [];
		let vertices: Array<any> = [];
		let ipos = 0;
		let dx = [1, 1, -1, -1], dy = [1, 0, 1, 0];

		let y = -W;
		while (M >>= 2) {
			for (let j = 0; j < 4; ++j) {
				for (let x = -W; x < W; x += 4 * w) {
					vertices[ipos + 0] = x + 0 * w; vertices[ipos + 1] = 0; vertices[ipos + 2] = y - 0 * w;
					vertices[ipos + 3] = x + 1 * w; vertices[ipos + 4] = 0; vertices[ipos + 5] = y - 0 * w;
					vertices[ipos + 6] = x + 2 * w; vertices[ipos + 7] = 0; vertices[ipos + 8] = y - 0 * w;
					vertices[ipos + 9] = x + 3 * w; vertices[ipos + 10] = 0; vertices[ipos + 11] = y - 0 * w;
					vertices[ipos + 12] = x + 4 * w; vertices[ipos + 13] = 0; vertices[ipos + 14] = y - 0 * w;
					vertices[ipos + 15] = x + 0 * w; vertices[ipos + 16] = 0; vertices[ipos + 17] = y - 1 * w;
					vertices[ipos + 18] = x + 4 * w; vertices[ipos + 19] = 0; vertices[ipos + 20] = y - 1 * w;

					if (dy[j]) {
						for (let k = 0; k < 21; k += 3) {
							vertices[ipos + k + 2] *= dx[j];
						}
					} else {
						for (let k = 0; k < 21; k += 3) {
							let t = vertices[ipos + k + 2] * dx[j];
							vertices[ipos + k + 2] = vertices[ipos + k + 0];
							vertices[ipos + k + 0] = t;
						}
					}

					let p = ipos / 3;
					indices.push(
						p + 0, p + 1, p + 5,
						p + 1, p + 2, p + 5,
						p + 2, p + 6, p + 5,
						p + 2, p + 3, p + 6,
						p + 3, p + 4, p + 6
					);
					ipos += 21;
				}
			}

			let x = -W;
			let fx = [1, 1, -1, -1], fy = [1, -1, 1, -1];
			for (let i = 0; i < 4; ++i) {
				vertices[ipos + 0] = x - 0 * w; vertices[ipos + 1] = 0; vertices[ipos + 2] = y - 0 * w;
				vertices[ipos + 3] = x - 0 * w; vertices[ipos + 4] = 0; vertices[ipos + 5] = y - 1 * w;
				vertices[ipos + 6] = y - 0 * w; vertices[ipos + 7] = 0; vertices[ipos + 8] = x - 0 * w;
				vertices[ipos + 9] = y - 1 * w; vertices[ipos + 10] = 0; vertices[ipos + 11] = x - 0 * w;

				for (let k = 0; k < 12; k += 3) {
					vertices[ipos + k + 0] *= fx[i];
					vertices[ipos + k + 2] *= fy[i];
				}

				let p = ipos / 3;
				indices.push(
					p + 0, p + 1, p + 2,
					p + 1, p + 2, p + 3
				);
				ipos += 12;
			}

			y -= w;
			w *= 4;
		}

		let x = -W, inf = 5e2;
		vertices[ipos + 0] = -inf; vertices[ipos + 1] = 0; vertices[ipos + 2] = -inf;
		vertices[ipos + 3] = inf; vertices[ipos + 4] = 0; vertices[ipos + 5] = -inf;
		vertices[ipos + 6] = inf; vertices[ipos + 7] = 0; vertices[ipos + 8] = inf;
		vertices[ipos + 9] = -inf; vertices[ipos + 10] = 0; vertices[ipos + 11] = inf;

		vertices[ipos + 12] = x; vertices[ipos + 13] = 0; vertices[ipos + 14] = y;
		vertices[ipos + 15] = -x; vertices[ipos + 16] = 0; vertices[ipos + 17] = y;
		vertices[ipos + 18] = -x; vertices[ipos + 19] = 0; vertices[ipos + 20] = -y;
		vertices[ipos + 21] = x; vertices[ipos + 22] = 0; vertices[ipos + 23] = -y;

		vertices[ipos + 24] = y; vertices[ipos + 25] = 0; vertices[ipos + 26] = x;
		vertices[ipos + 27] = -y; vertices[ipos + 28] = 0; vertices[ipos + 29] = x;
		vertices[ipos + 30] = -y; vertices[ipos + 31] = 0; vertices[ipos + 32] = -x;
		vertices[ipos + 33] = y; vertices[ipos + 34] = 0; vertices[ipos + 35] = -x;

		let p = ipos / 3;
		indices.push(
			p + 0, p + 4, p + 8,
			p + 0, p + 4, p + 5,
			p + 1, p + 5, p + 0,
			p + 1, p + 5, p + 9,
			p + 1, p + 9, p + 10,
			p + 1, p + 10, p + 2,
			p + 2, p + 6, p + 10,
			p + 2, p + 6, p + 7,
			p + 2, p + 3, p + 7,
			p + 3, p + 0, p + 8,
			p + 3, p + 7, p + 11,
			p + 3, p + 8, p + 11
		);

		// console.log(vertices, indices)


		// vertices = [1, 1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1,
		// 	1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1]
		// indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]
		const normals = new Array(vertices.length).fill(0).map((_, i) => i % 3 == 1 ? 1 : 0)
		const mx = M * w / 2;
		const uvs = vertices.map(e => (e / mx + 1) * .5).filter((_, i) => i % 3 != 1)
		geometry.setIndex(indices);
		geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
		geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
		geometry.addAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))

		return geometry;
	}
}

export default class MyRenderer extends DirectRenderer {

	box = new LayeredView()
	state: "normal" | "profile" = "normal"

	private fftEffect = new FFTWaveEffect()

	matNormal = new THREE.MeshPhysicalMaterial({
		color: 0x156289,
		side: THREE.DoubleSide,
		displacementMap: this.fftEffect.textures[0],
		displacementScale: 2e-4,
		flatShading: true		// hard edges
	})

	constructor() {
		super()

		this.gui.add(this, "state", ["normal", "profile"])

		this.camera.position.y = 10

		// let plane = new PlaneGeometry(5, 5, 5, 5)
		// let plane = new lodPlane()
		// let material = new THREE.MeshPhongMaterial({
		// 	specular: 0x111111, shininess: 250,
		// 	side: THREE.DoubleSide, vertexColors: THREE.VertexColors
		// });

		//let boundary = new lodBoundary(64, 0.005 * (1 << 8))
		// let plane = new testPlane().rotateX(3 * Math.PI / 2)
		// itemSize = 3 because there are 3 values (components) per vertex

		// console.log(new PlaneGeometry(1, 1))

		let plane = new LODPlane(3, 32, 0.02)
		let boundary = new LODBoundary(32, 0.02 * (1 << 3))
		let material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
		let mesh = new THREE.Mesh(plane, this.matNormal);
		let meshBoundary = new THREE.Mesh(boundary, this.matNormal)
		this.scene.add(new THREE.WireframeHelper(mesh));
		// this.scene.add(meshBoundary)
		this.scene.add(new THREE.WireframeHelper(meshBoundary))

		// this.scene.add(new THREE.WireframeHelper(mesh))

		// let planes = [
		// 	[new THREE.PlaneGeometry(20, 20, 5, 5), 300],
		// 	[new THREE.PlaneGeometry(20, 20, 10, 10), 100],
		// 	[new THREE.PlaneGeometry(20, 20, 40, 40), 70],
		// 	[new THREE.PlaneGeometry(20, 20, 70, 70), 15],
		// 	[new THREE.PlaneGeometry(20, 20, 100, 100), 0]
		// ];

		// let plane, mesh, lod
		// lod = new THREE.LOD()
		// for (let i = 0; i < planes.length; i++) {
		// 	plane = planes[i][0]
		// 	plane.rotateX(-Math.PI / 3)
		// 	plane.translate(0, -1e-4, 0)

		// 	mesh = new THREE.Mesh(plane, this.matNormal)
		// 	this.box.addToLayer(0, mesh)
		// 	lod.addLevel(mesh, planes[i][1])
		// }

		// this.scene.add(lod)


		// let geo = new THREE.PlaneGeometry(20, 20, 100, 100)
		// geo.rotateX(-Math.PI / 3)
		// geo.translate(0, -1e-4, 0)
		// let box = new THREE.Mesh(geo, this.matNormal)
		// this.box.addToLayer(0, box)
		// this.scene.add(this.box)

		// this.scene.add(new THREE.AmbientLight(0x888888))

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		lightHelper.layers.mask = 0xffffffff
		this.scene.add(lightHelper)

		const { begin } = this.pipeline
		const res = begin.then(this.fftEffect)
		// .then(CopyShader, target)
		// .out()

		// res
		// .out()
	}

	// private target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
	// 	minFilter: THREE.LinearFilter,
	// 	magFilter: THREE.LinearFilter,
	// 	format: THREE.RGBFormat
	// })
	private pipeline = new Pipeline(this.threeJsRenderer)

	OnUpdate() {
		// const time = window.performance.now() * 0.0001

		// const speed = 2e-2

		// this.box.rotation.x += Math.sin(time) * speed
		// this.box.rotation.y += Math.cos(time) * speed
	}

	OnNewFrame() {
		this.scene.traverse((object) => {
			if (object instanceof THREE.LOD) {
				object.update(this.camera);
			}
		})
		this.pipeline.render()

		this.threeJsRenderer.render(this.scene, this.camera)

		requestAnimationFrame(this.nextFrame)
	}
}
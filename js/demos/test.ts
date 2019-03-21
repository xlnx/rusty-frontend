import * as THREE from "three"
import { LayeredView, DirectRenderer, Pipeline, RenderStage, PostStage, Prefab } from "../wasp";

class G extends THREE.BufferGeometry {
	constructor() {
		super()

		let vertices = new Float32Array([
			1, 1, 1,
			1, -1, 1,
			-1, -1, 1,
			-1, 1, 1,
			1, 1, -1,
			1, -1, -1,
			-1, -1, -1,
			-1, 1, -1,
		])
		let indices = [
			0, 2, 1,
			0, 3, 2,

			4, 5, 6,
			4, 6, 7,

			2, 3, 7,
			2, 7, 6,

			0, 4, 3,
			4, 7, 3,

			1, 2, 5,
			2, 6, 5,

			0, 1, 4,
			1, 5, 4
		]
		this.addAttribute("position", new THREE.BufferAttribute(vertices, 3))
		this.setIndex(indices)
	}
}

class LODPlane extends THREE.BufferGeometry {
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
export default class MyRenderer extends DirectRenderer {

	private box = new LayeredView()
	private state: "normal" | "profile" = "normal"
	private pipeline = new Pipeline(this.threeJsRenderer)

	matNormal = new THREE.MeshPhysicalMaterial({
		color: 0x156289,
		displacementScale: 1e-4,
		flatShading: true		// hard edges
	})

	constructor() {
		super()

		this.gui.add(this, "state", ["normal", "profile"])

		this.camera.position.z = 4



		let start = new THREE.Vector3(0, 0, 0)
		let end = new THREE.Vector3(1, 1, 1)
		let dir = end.clone().sub(start)
		const width = 1
		const origin = start.clone()
		const up = new THREE.Vector3(0, 1, 0)
		let norm = dir.clone().cross(up).normalize()
		start.sub(norm.clone().multiplyScalar(width / 2))
		end.sub(norm.clone().multiplyScalar(width / 2))
		norm = origin.clone().sub(norm)
		let uSeg = 10
		let vSeg = 10
		let geo = new THREE.ParametricGeometry((u, v, w) => {
			let U = Math.round(uSeg * u)
			let V = Math.round(vSeg * v)
			const { x, y, z } = start
			w.set(x, y, z).add(dir.clone().multiplyScalar(u)).add(norm.clone().multiplyScalar(v))
			// return start.clone().add(dir.clone().multiplyScalar(u)).add(norm.clone().multiplyScalar(v))
		}, uSeg, vSeg)

		// function plane(u, v, w) {
		// 	var width = 50, height = 100;//平面宽高尺寸
		// 	var x = u * width;//等比例运算
		// 	var y = v * height;//等比例运算
		// 	var z = 0;
		// 	w.set(x, y, z)
		// }
		// var geometry = new THREE.ParametricGeometry(plane, 10, 10);
		var material = new THREE.MeshPhongMaterial({
			color: 0x0000ff,//三角面颜色
			side: THREE.DoubleSide//两面可见
		});//材质对象
		material.wireframe = true;//线条模式渲染(查看细分数)
		var mesh = new THREE.Mesh(geo, material);//线模型对象
		this.scene.add(mesh);//线模型添加到场景中
		console.log(geo)


		let g = new LODPlane(3, 32, 0.02)
		// g.rotateX(Math.PI / 3)
		// g.translate(0, -1e-4, 0)
		let box = new THREE.Mesh(g, this.matNormal)
		// this.box.addToLayer(0, box)
		this.box.addToLayer(0, new THREE.WireframeHelper(box))
		this.scene.add(this.box)

		this.scene.add(new THREE.AmbientLight(0xcccccc))

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		lightHelper.layers.mask = 0xffffffff
		this.scene.add(lightHelper)

		this.scene.add(new THREE.AxesHelper(10))

		const { begin } = this.pipeline
		begin.then(new RenderStage(this.scene, this.camera))
			.then(Prefab.FXAAShader)
			.out()
	}

	OnNewFrame() {
		this.pipeline.render()

		requestAnimationFrame(this.nextFrame)
	}
}
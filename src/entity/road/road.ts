import { DistUnit, plain2world } from "../../legacy";
import { roadHeight } from "../../basemap/def";
import BasemapRoadItem from "../../basemap/roadItem";
import { Terrain } from "../terrain/terrain";
import { TexAsset, NumberVariable, Geometry2D } from "../../wasp";
import { Basemap } from "../../basemap/basemap";

export class RoadIndicator extends THREE.Object3D {

	// frameColor: { value: new THREE.Vector4(0.38, 0.65, 0.76, 0.7) },
	// fillColor: { value: new THREE.Vector4(0.5, 0.72, 0.85, 0.5) }
	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2)

	private static up = new THREE.Vector3(0, 1, 0)
	// private v: Variable
	private v: THREE.Vector2

	public readonly item: BasemapRoadItem

	private readonly l = new NumberVariable(0)

	private _valid = false

	private object = new THREE.Object3D()

	get valid() { return this._valid }
	get length() { return this.l.value }
	get to() { return this.v }

	private setTo(coord: THREE.Vector2) {
		this.v = coord
		this.item.to = coord
		const d = this.to.clone().sub(this.from)
		this.object.setRotationFromAxisAngle(RoadIndicator.up, d.angle())
		this.l.set(d.length() || 0.1)

		// this.addPtIdk(coord)
	}

	private readonly mat = new THREE.MeshBasicMaterial({
		color: RoadIndicator.validColor,
		side: THREE.DoubleSide,
		opacity: 0.2,
		transparent: true
	})
	private readonly matz = new THREE.MeshBasicMaterial({
		color: RoadIndicator.validColor,
		side: THREE.DoubleSide,
		opacity: 0.96,
		transparent: true
	})

	private setValid(val: boolean) {
		if (this._valid = val) {
			this.mat.color.set(RoadIndicator.validColor)
			this.matz.color.set(RoadIndicator.validColor)
		} else {
			this.mat.color.set(RoadIndicator.invalidColor)
			this.matz.color.set(RoadIndicator.invalidColor)
		}
	}

	adjustFrom(coord: THREE.Vector2) {
		Object.assign(this.from, coord.clone())
		const { x, y: y_, z } = plain2world(this.from)
		this.object.position.set(x, y_, z)
	}
	adjustTo(coord: THREE.Vector2, aligning: boolean = false) {
		this.setTo(this.basemap.attachNearPoint(coord))

		const lengthAssert = aligning
		const val = this.basemap.alignRoad(this.item, lengthAssert)
		// console.log(val)
		this.setValid(val)
	}

	constructor(private readonly basemap: Basemap<{}, {}>,
		public readonly width: number,
		public from: THREE.Vector2,
		private pt: THREE.Vector2) {

		super()

		this.v = pt
		// this.v = new Variable(pt)
		const r = width / 2

		this.item = new BasemapRoadItem(width, from, pt)

		const yy = new THREE.RingGeometry(r, r + .1, 32, 0, undefined, Math.PI)
		const y = new THREE.CircleGeometry(r, 32, 0, Math.PI)
		const h = new THREE.PlaneGeometry(1, 1, 1, 1)

		const mat = this.mat
		const matz = this.matz

		const { mesh: u1 } = new Geometry2D(y, mat)
		const { mesh: v1 } = new Geometry2D(yy, matz)
		const { mesh: c } = new Geometry2D(h, mat).scale(r * 2, this.l).translate(0, this.l.div(2))
		const { mesh: u2 } = new Geometry2D(y, mat).translate(0, this.l).rotate(Math.PI)
		const { mesh: v2 } = new Geometry2D(yy, matz).translate(0, this.l).rotate(Math.PI)
		const { mesh: e1 } = new Geometry2D(h, matz).scale(.1, this.l).translate(r + .05, this.l.div(2))
		const { mesh: e2 } = new Geometry2D(h, matz).scale(.1, this.l).translate(-r - .05, this.l.div(2))

		const { mesh: f1 } = new Geometry2D(h, matz).scale(r * 2 + 8, .1).translate(0, 0)
		const { mesh: f2 } = new Geometry2D(h, matz).scale(r * 2 + 8, .1).translate(0, this.l)
		const { mesh: f3 } = new Geometry2D(h, matz).scale(.1, this.l).translate(r + 4, this.l.div(2))
		const { mesh: f4 } = new Geometry2D(h, matz).scale(.1, this.l).translate(-r - 4, this.l.div(2))

		const w = new THREE.Object3D()
		w.add(u1, v1, c, u2, v2, e1, e2, f1, f2, f3, f4)
		w.scale.setScalar(DistUnit)
		w.rotateY(Math.PI / 2)

		this.object.add(w)
		this.adjustFrom(from)
		// const { x, y: y_, z } = plain2world(from)
		// this.object.position.set(x, y_, z)

		this.add(this.object)

		// this.ptIdks.rotateY(Math.PI / 2)
		// this.ptIdks.position.set(0, 0, 0)
		// this.view.addToLayer(CityLayer.Indicator, this.ptIdks)

		this.setTo(pt)
	}
}

export class Road extends THREE.Object3D {

	private static up = new THREE.Vector3(0, 1, 0)

	private static material = (() => {
		const texture = new TexAsset("textures/b.png").loadSync()
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping
		return new THREE.MeshLambertMaterial({
			map: texture,
			side: THREE.DoubleSide,
			// wireframe: true
		})
	})()

	private readonly view = new THREE.Object3D()
	private geometry: THREE.Geometry = <any>null
	private object: THREE.Mesh = <any>null

	constructor(
		ground: Terrain,
		public readonly width: number,
		public readonly item: BasemapRoadItem<Road>) {

		super()

		this.add(this.view)

		this.item.userData = this

		const { geometry, startHeight } = this.boxGeometry(ground)
		this.geometry = geometry
		this.object = new THREE.Mesh(this.geometry, Road.material)

		this.geometry.scale(DistUnit, DistUnit, DistUnit)

		let wfrom = plain2world(this.item.from)
		let wto = plain2world(this.item.to)
		let dir = wto.clone().sub(wfrom)
		let angle = Math.acos(dir.clone().normalize().dot(new THREE.Vector3(1, 0, 0))) * (dir.z > 0 ? -1 : 1)
		this.geometry.rotateY(angle)

		this.view.translateX(wfrom.x)
		this.view.translateZ(wfrom.z)
		this.view.translateY(startHeight * DistUnit)

		this.view.add(this.object)
	}

	boxGeometry(ground: Terrain): {
		geometry: THREE.Geometry, startHeight: number, roadWidth: number
	} {

		//need height fix here
		let origin = new THREE.Vector3(0, 0, 0)
		let up = new THREE.Vector3(0, 1, 0)
		// let botWidth = this.item.width * 0.3
		let botWidth = roadHeight
		let roadWidth = this.item.width * 3
		let midWidth = roadWidth + botWidth
		let upWidth = midWidth + botWidth

		let from = this.item.from.clone()
		let From = new THREE.Vector3(from.x, 0, -from.y)

		let to = this.item.to.clone()
		let To = new THREE.Vector3(to.x, 0, -to.y)

		// let dir = To.clone().sub(From)
		let dir = new THREE.Vector3(To.clone().sub(From).length(), 0, 0)
		let norm = origin.clone().sub(
			dir.clone()
				.normalize()
				.cross(up)
				.multiplyScalar(upWidth)
		)
		// let start = origin.clone()
		let start = new THREE.Vector3(0, 0, upWidth * 3 / 8)

		let uSeg = Math.round(dir.length()) * 3 + 1
		let botVPos = 1
		let midVPos = 1 + botVPos
		let upVPos = botVPos + midVPos
		let vSeg = upVPos + 1

		// console.log(from, to)
		let pts: THREE.Vector2[] = []
		for (let i = 0; i < uSeg; ++i) {
			let pt = from.clone()
				.add(to.clone()
					.sub(from)
					.multiplyScalar(i / uSeg))
			pts.push(pt)
		}
		let heights = ground.getHeight(pts)
		let startHeight = heights[0]
		for (let i = 0; i < uSeg; ++i)
			heights[i] -= startHeight

		const geometry = new THREE.Geometry()
		let face = geometry.faces
		for (let u = 0; u < uSeg; ++u) {
			for (let v = 0; v < vSeg; ++v) {

				let uPos = u / (uSeg - 1)
				let w = start.clone()
				const { x, y, z } = start.clone()

				let height = heights[u]
				if (v < botVPos) {
					// w.set(x, 0 - (botVPos - vPos) * botWidth, z)
					// w.set(x, ground.getHeight(axesPos) - (botVPos - vPos) * botWidth, z)
					w.set(x, height - (botVPos - v) * botWidth, z)
						.add(norm.clone().multiplyScalar(botVPos / vSeg - v / vSeg))
				}
				else if (v > midVPos) {
					// w.set(x, 0 - (vPos - midVPos) * botWidth, z)
					// w.set(x, ground.getHeight(axesPos) - (vPos - midVPos) * botWidth, z)
					w.set(x, height - (v - midVPos) * botWidth, z)
						.sub(norm.clone().multiplyScalar(v / vSeg - midVPos / vSeg))
				}
				else {
					// w.set(x, ground.getHeight(axesPos), z)
					w.set(x, height, z)
					// w.set(x, 0, z)
				}
				w.add(dir.clone().multiplyScalar(uPos))
					.add(norm.clone().multiplyScalar(v / vSeg))
					.add(new THREE.Vector3(0, botWidth, 0))//lift up the road

				geometry.vertices.push(w)
			}
		}
		let dif = [0, 1, vSeg, vSeg + 1]
		let ptIdx = 0
		for (let u = 0; u < uSeg - 1; ++u) {
			for (let v = 0; v < vSeg - 1; ++v) {
				let pts: number[] = []
				for (let i = 0; i < 4; ++i)
					pts.push(ptIdx + dif[i])
				face.push(new THREE.Face3(pts[0], pts[1], pts[2]))
				face.push(new THREE.Face3(pts[1], pts[2], pts[3]))
				++ptIdx
			}
			++ptIdx
		}
		geometry.elementsNeedUpdate = true
		geometry.computeFaceNormals()

		return { geometry, startHeight, roadWidth }
	}

}

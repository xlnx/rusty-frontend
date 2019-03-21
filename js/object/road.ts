import * as THREE from "three"
import { DistUnit, ObjectTag, CityLayer } from "../asset/def";
import BasemapRoadItem from "../model/roadItem";
import { plain2world } from "../object/trans";
import { Thing, Layer, TexAsset, Geometry2D, NumberVariable } from "../wasp";
import { Building } from "./building";
import { Basemap } from "../model/basemap";
import { Asset } from "../wasp/asset/asset";
import { ParametricGeometry } from "three";
import Ground from "./ground";

class RoadIndicator extends Thing {

	// frameColor: { value: new THREE.Vector4(0.38, 0.65, 0.76, 0.7) },
	// fillColor: { value: new THREE.Vector4(0.5, 0.72, 0.85, 0.5) }
	private static readonly validColor = new THREE.Color(0.44, 0.52, 0.84)
	private static readonly invalidColor = new THREE.Color(0.8, 0.3, 0.2)

	private static up = new THREE.Vector3(0, 1, 0)

	public readonly item

	private readonly l = new NumberVariable(0)

	private _valid = false

	get valid() { return this._valid }
	get length() { return this.l.value }
	get to() { return this.v }
	private setTo(coord: THREE.Vector2) {
		this.v = coord
		this.item.to = coord
		const d = this.to.clone().sub(this.from)
		this.view.setRotationFromAxisAngle(RoadIndicator.up, d.angle())
		this.l.set(d.length() || 0.1)
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
			this.mat.color.set(RoadIndicator.validColor)
		} else {
			this.matz.color.set(RoadIndicator.invalidColor)
			this.matz.color.set(RoadIndicator.invalidColor)
		}
	}

	adjust(coord: THREE.Vector2) {
		this.setTo(coord)
		this.setValid(this.basemap.alignRoad(this.item))
	}

	constructor(private readonly basemap: Basemap<Road, Building>,
		public readonly width: number,
		public readonly from: THREE.Vector2,
		private v: THREE.Vector2) {

		super()

		const r = width / 2

		this.item = new BasemapRoadItem(width, from, v)

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

		this.view.addToLayer(CityLayer.Indicator, w)

		const { x, y: y_, z } = plain2world(from)
		this.view.position.set(x, y_, z)
		this.setTo(v)
	}
}

class Road extends Thing<ObjectTag> {

	private static up = new THREE.Vector3(0, 1, 0)

	private static material = (() => {
		const texture = new TexAsset("textures/b.png").loadSync()
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping
		return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide })
	})()

	// private static geometry = (() => {
	// 	const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
	// 	geometry.rotateX(-Math.PI / 2)
	// 	geometry.translate(0.5, 0, 0)
	// 	geometry.scale(DistUnit, DistUnit, DistUnit)
	// 	return geometry
	// })()

	// private readonly geometry = Road.geometry.clone()
	// private readonly uvs = this.geometry.faceVertexUvs[0]

	// private readonly object = new THREE.Mesh(this.geometry, Road.material)
	private geometry: THREE.Geometry = <any>null
	private object: THREE.Mesh = <any>null


	public readonly item: BasemapRoadItem<Road>

	constructor(public readonly width: number, from: THREE.Vector2, to: THREE.Vector2) {
		super()

		this.item = new BasemapRoadItem<Road>(width, from, to)
		this.item.userData = this
		// const d = to.clone().sub(from)
		// const len = d.length() || 0.1

		//test
		// this.geometry.scale(len, 1, 1 * width)


		// this.view.rotateY(d.angle())
		// const { x, y, z } = plain2world(from)
		// this.view.position.set(x, y, z)

		// this.object.position.set(x, y, z)
		// this.object.setRotationFromAxisAngle(Road.up, d.angle())
		// this.object.scale.set(len, 1, 1 * width) //
		// this.uvs[0][2].set(len / width, 1)
		// this.uvs[1][1].set(len / width, 0)
		// this.uvs[1][2].set(len / width, 1)
		// this.view.addToLayer(Layer.All, this.object)

	}

	planeGeometry(ground: Ground): Road {
		//need height fix here
		let origin = new THREE.Vector3(0, 0, 0)
		let up = new THREE.Vector3(0, 1, 0)
		let width = this.item.width * DistUnit

		let from = this.item.from
		let From = plain2world(from)
		let fromHeight = ground.getHeight(from)

		let to = this.item.to
		let To = plain2world(this.item.to)
		let toHeight = ground.getHeight(to)

		// console.log(fromHeight, toHeight)

		// From.add(new THREE.Vector3(0, fromHeight, 0))
		// To.add(new THREE.Vector3(0, toHeight, 0))
		let dir = To.clone().sub(From)
		let norm = dir.clone().normalize().cross(up).multiplyScalar(width)
		// console.log("from:", from, " to:", to)
		let start = From.clone().sub(norm.clone().multiplyScalar(0.5))
		// console.log(start, dir, norm)

		let uSeg = 10
		let vSeg = 5
		this.geometry = new THREE.ParametricGeometry((u, v, w) => {
			const { x, y, z } = start.clone()
			let d = from.clone()
				.add(to.clone()
					.sub(from)
					.multiplyScalar(u))
			w.set(x, ground.getHeight(d), z)
			w.add(dir.clone().multiplyScalar(u))
				.add(norm.clone().multiplyScalar(v))
			// console.log(w)
		}, uSeg, vSeg).clone()
		console.log(this.geometry)

		this.object = new THREE.Mesh(this.geometry, Road.material)
		const wire = new THREE.WireframeHelper(this.object)
		this.view.addToLayer(Layer.All, wire)
		// this.geometry.translate(From.x, From.y, From.z)
		return this
	}

	boxGeometry(ground: Ground): Road {
		//need height fix here
		let origin = new THREE.Vector3(0, 0, 0)
		let up = new THREE.Vector3(0, 1, 0)
		let botWidth = this.item.width * 0.1
		let midWidth = this.item.width * DistUnit + botWidth
		let upWidth = midWidth + botWidth

		let from = this.item.from
		let From = plain2world(from)
		let fromHeight = ground.getHeight(from)

		let to = this.item.to
		let To = plain2world(this.item.to)
		let toHeight = ground.getHeight(to)

		// console.log(fromHeight, toHeight)

		// From.add(new THREE.Vector3(0, fromHeight, 0))
		// To.add(new THREE.Vector3(0, toHeight, 0))
		let dir = To.clone().sub(From)
		let norm = dir.clone().normalize().cross(up).multiplyScalar(upWidth)
		// console.log("from:", from, " to:", to)
		let start = From.clone()
			.sub(norm.clone().multiplyScalar(0.5))
		// console.log(start, dir, norm)

		let uSeg = Math.round(dir.length()) * 5
		let botVPos = 1
		let midVPos = 5 + botVPos
		let upVPos = botVPos + midVPos
		let vSeg = upVPos
		this.geometry = new THREE.ParametricGeometry((u, v, w) => {
			const { x, y, z } = start.clone()
			let vPos = Math.round(vSeg * v)
			let axesPos = from.clone()
				.add(to.clone()
					.sub(from)
					.multiplyScalar(u))
			if (vPos < botVPos) {
				w.set(x, ground.getHeight(axesPos) - (botVPos - vPos) * botWidth, z)
					.add(norm.clone().multiplyScalar(botVPos / vSeg - v))
			}
			else if (vPos > midVPos) {
				w.set(x, ground.getHeight(axesPos) - (vPos - midVPos) * botWidth, z)
					.sub(norm.clone().multiplyScalar(v - midVPos / vSeg))
			}
			else {
				w.set(x, ground.getHeight(axesPos), z)
			}
			w.add(dir.clone().multiplyScalar(u))
				.add(norm.clone().multiplyScalar(v))
				.add(new THREE.Vector3(0, botWidth / 5, 0))
			// console.log(w)
		}, uSeg, vSeg)
		// console.log(this.geometry)

		this.object = new THREE.Mesh(this.geometry, Road.material)
		const wire = new THREE.WireframeHelper(this.object)
		this.view.addToLayer(Layer.All, wire)
		// this.geometry.translate(From.x, From.y, From.z)

		return this
	}
}

export {
	Road, RoadIndicator
}
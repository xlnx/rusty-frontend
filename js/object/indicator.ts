import * as THREE from "three"
import { DistUnit } from "../asset/def";
import BasemapRoadItem from "../model/roadItem";
import { plain2world } from "./trans";
import { Thing, Layer, Geometry2D, NumberVariable } from "../wasp";

export default class Indicator extends Thing {

	private static up = new THREE.Vector3(0, 1, 0)

	private readonly object: THREE.Object3D

	public readonly item

	private readonly l = new NumberVariable(0)
	get length() { return this.l.value }
	set length(val: number) { this.l.set(val) }

	get to() { return this.v }
	set to(v: THREE.Vector2) {
		this.v = v
		this.item.to = v
		const d = this.to.clone().sub(this.from)
		this.object.setRotationFromAxisAngle(Indicator.up, d.angle())
		this.l.set(d.length() || 0.1)
	}

	constructor(public readonly width: number, public readonly from: THREE.Vector2,
		private v: THREE.Vector2) {

		super()

		const r = width / 2

		this.item = new BasemapRoadItem(width, from, v)

		const yy = new THREE.RingGeometry(r, r + .1, 32, 0, undefined, Math.PI)
		const y = new THREE.CircleGeometry(r, 32, 0, Math.PI)
		const h = new THREE.PlaneGeometry(1, 1, 1, 1)

		const mat = new THREE.ShaderMaterial({
			fragmentShader: "void main() { gl_FragColor = vec4(0, 0, 0.6, 0.1); }",
			side: THREE.DoubleSide,
			transparent: true
		})
		const matz = new THREE.ShaderMaterial({
			fragmentShader: "void main() { gl_FragColor = vec4(0, 0, 0.7, 0.6); }",
			side: THREE.DoubleSide,
			transparent: true
		})

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
		this.object = new THREE.Object3D()
		this.object.add(w)

		const { x, y: y_, z } = plain2world(from)
		this.object.position.set(x, y_, z)
		this.view.addToLayer(Layer.All, this.object)

		this.to = v
	}
}
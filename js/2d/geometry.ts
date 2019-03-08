import * as THREE from "three"

type Subscriber = (value: any) => void

type Placeholder = Variable | number | boolean | string
type NumberPlaceholder = NumberVariable | number

class Variable {

	private subscribers: Subscriber[] = []

	constructor(private val: any) { }

	set(val: any) { this.value = val }
	set value(val: any) { this.val = val; for (const f of this.subscribers) f(this.value) }
	get value() { return this.val }

	subscribe(onChange: Subscriber) { this.subscribers.push(onChange) }

	static subscribeIf(ph: Placeholder, onChange: Subscriber) {
		if (typeof ph == "object") ph.subscribe(onChange)
	}

}

class NumberVariable extends Variable {

	private static binop(op: (x: number, y: number) => number,
		lhs: NumberVariable, rhs: NumberVariable | number): NumberVariable {
		if (typeof rhs == "number") {
			const res = new NumberVariable(op(lhs.value, rhs))
			lhs.subscribe(val => res.value = op(val, rhs))
			return res
		} else {
			const res = new NumberVariable(op(lhs.value, rhs.value))
			lhs.subscribe(val => res.value = op(val, rhs.value))
			rhs.subscribe(val => res.value = op(lhs.value, val))
			return res
		}
	}

	private static unaop(op: (x: number) => number,
		lhs: NumberVariable): NumberVariable {
		const res = new NumberVariable(op(lhs.value))
		lhs.subscribe(val => res.value = op(lhs.value))
		return res
	}

	add(other: NumberVariable | number): NumberVariable {
		return NumberVariable.binop((x, y) => x + y, this, other)
	}
	sub(other: NumberVariable | number): NumberVariable {
		return NumberVariable.binop((x, y) => x - y, this, other)
	}
	mul(other: NumberVariable | number): NumberVariable {
		return NumberVariable.binop((x, y) => x * y, this, other)
	}
	div(other: NumberVariable | number): NumberVariable {
		return NumberVariable.binop((x, y) => x / y, this, other)
	}
	rev(): NumberVariable {
		return NumberVariable.unaop((x) => -x, this)
	}

}

interface Geometry {



	trans(x: Placeholder, y: Placeholder, z: Placeholder): Geometry
	// rotX(ang: Placeholder): Geometry
	// rotY(ang: Placeholder): Geometry
	// rotZ(ang: Placeholder): Geometry

}

abstract class Transform {
	protected mat: any

	protected next?: Transform
	constructor(protected readonly mesh: THREE.Mesh) { }
	protected abstract apply(): void
	then(trans: Transform) {
		for (let tr: Transform = this; tr; tr = tr.next!) {
			if (!tr.next) {
				tr.next = trans
				break
			}
		}
	}
	protected update() {
		this.mat = {
			pos: this.mesh.position.clone(),
			rot: this.mesh.rotation.clone(),
			scl: this.mesh.scale.clone()
		}
	}
	protected applyAll() {
		this.mesh.position.set(this.mat.pos.x, this.mat.pos.y, this.mat.pos.z)
		this.mesh.rotation.set(this.mat.rot.x, this.mat.rot.y, this.mat.rot.z)
		this.mesh.scale.set(this.mat.scl.x, this.mat.scl.y, this.mat.scl.z)
		for (let tr: Transform = this; tr; tr = tr.next!) tr.apply()
	}
}

class Translate extends Transform {
	constructor(mesh: THREE.Mesh,
		private readonly x: NumberPlaceholder,
		private readonly y: NumberPlaceholder) {

		super(mesh)

		Variable.subscribeIf(x, () => this.applyAll())
		Variable.subscribeIf(y, () => this.applyAll())
		this.apply()
	}
	protected apply() {
		this.update()
		this.mesh.translateX(typeof this.x == "object" ? this.x.value : this.x)
		this.mesh.translateZ(typeof this.y == "object" ? this.y.value : this.y)
	}
}

class Rotate extends Transform {
	constructor(mesh: THREE.Mesh,
		private readonly ang: NumberPlaceholder) {

		super(mesh)

		Variable.subscribeIf(ang, () => this.applyAll())
		this.apply()
	}
	protected apply() {
		this.update()
		this.mesh.rotateY(typeof this.ang == "object" ? this.ang.value : this.ang)
	}
}

class Scale extends Transform {
	constructor(mesh: THREE.Mesh,
		private readonly x: NumberPlaceholder,
		private readonly y: NumberPlaceholder) {

		super(mesh)

		Variable.subscribeIf(x, () => this.applyAll())
		Variable.subscribeIf(y, () => this.applyAll())
		this.apply()
	}
	protected apply() {
		this.update()
		this.mesh.scale.multiply(new THREE.Vector3(
			typeof this.x == "object" ? this.x.value : this.x,
			1, typeof this.y == "object" ? this.y.value : this.y))
	}
}

class Geometry2D {

	private tr?: Transform

	public readonly mesh: THREE.Mesh

	constructor(geometry?: THREE.Geometry | THREE.BufferGeometry,
		material?: THREE.Material | THREE.Material[]) {
		const geo = geometry!.clone()
		geo.rotateX(-Math.PI / 2)
		this.mesh = new THREE.Mesh(geo, material)
	}

	translate(x: NumberPlaceholder, y: NumberPlaceholder): Geometry2D {
		this.applyTransform(new Translate(this.mesh, x, y))
		return this
	}

	rotate(angle: NumberPlaceholder): Geometry2D {
		this.applyTransform(new Rotate(this.mesh, angle))
		return this
	}

	scale(x: NumberPlaceholder, y: NumberPlaceholder): Geometry2D {
		this.applyTransform(new Scale(this.mesh, x, y))
		return this
	}

	private applyTransform(trans: Transform) {
		if (!this.tr) {
			this.tr = trans
		} else {
			this.tr.then(trans)
		}
	}

}

export {
	Geometry2D,
	Variable,
	Placeholder,
	NumberVariable,
	NumberPlaceholder
}
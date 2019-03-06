import * as THREE from "three"
import TexAsset from "../asset/tex";
import { DistUnit } from "../asset/def";

export default class RoadPrototype {

	private static up = new THREE.Vector3(0, 1, 0)

	private static material = (() => {
		const texture = new TexAsset("textures/b.png").loadSync()
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping
		return new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide })
	})()

	private static geometry = (() => {
		const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
		geometry.rotateX(-Math.PI / 2)
		geometry.translate(0.5, 0, 0)
		geometry.scale(DistUnit, DistUnit, DistUnit)
		return geometry
	})()

	private readonly geometry = RoadPrototype.geometry.clone()
	private readonly uvs = this.geometry.faceVertexUvs[0]

	public readonly object = new THREE.Mesh(this.geometry, RoadPrototype.material)

	get length() { return this.to.clone().sub(this.from).length() }

	get to() { return this.v }
	set to(v: THREE.Vector2) {
		this.v = v
		this.object.setRotationFromAxisAngle(RoadPrototype.up,
			-this.to.clone().sub(this.from).angle())
		const len = this.length || 0.1
		this.object.scale.set(len, 1, 1)
		this.uvs[0][2].set(len, 1)
		this.uvs[1][1].set(len, 0)
		this.uvs[1][2].set(len, 1)
		this.geometry.uvsNeedUpdate = true
	}

	constructor(public readonly from: THREE.Vector2, private v: THREE.Vector2) {
		this.object.position.set(from.x * DistUnit, 0, from.y * DistUnit)
		this.to = v
	}

}
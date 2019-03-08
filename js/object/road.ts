import * as THREE from "three"
import TexAsset from "../asset/tex";
import { DistUnit } from "../asset/def";
import { RoadLikeObject } from "../model/def";
import RoadMathImpl from "../model/road";
import { plain2world } from "../2d/trans";

export default class Road implements RoadLikeObject {

	private static up = new THREE.Vector3(0, 1, 0)

	public readonly mathImpl: RoadMathImpl

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

	private readonly geometry = Road.geometry.clone()
	private readonly uvs = this.geometry.faceVertexUvs[0]

	public readonly object = new THREE.Mesh(this.geometry, Road.material)

	constructor(public readonly width: number, from: THREE.Vector2, to: THREE.Vector2) {
		this.mathImpl = new RoadMathImpl(this, from, to)
		const { x, y, z } = plain2world(from)
		this.object.position.set(x, y, z)
		const d = to.clone().sub(from)
		this.object.setRotationFromAxisAngle(Road.up, d.angle())
		const len = d.length() || 0.1
		this.object.scale.set(len, 1, 1 * width) //
		this.uvs[0][2].set(len, 1)
		this.uvs[1][1].set(len, 0)
		this.uvs[1][2].set(len, 1)
		this.geometry.uvsNeedUpdate = true
	}

}
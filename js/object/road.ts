import * as THREE from "three"
import { DistUnit } from "../asset/def";
import BasemapRoadItem from "../model/roadItem";
import { plain2world } from "../object/trans";
import { Thing, Layer, TexAsset } from "../wasp";

export default class Road extends Thing {

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

	private readonly geometry = Road.geometry.clone()
	private readonly uvs = this.geometry.faceVertexUvs[0]

	private readonly object = new THREE.Mesh(this.geometry, Road.material)

	public readonly item: BasemapRoadItem<Road>

	constructor(public readonly width: number, from: THREE.Vector2, to: THREE.Vector2) {
		super()

		this.item = new BasemapRoadItem<Road>(width, from, to)
		this.item.userData = this

		const { x, y, z } = plain2world(from)
		const d = to.clone().sub(from)
		const len = d.length() || 0.1

		this.geometry.scale(len, 1, 1 * width)
		this.geometry.rotateY(d.angle())
		this.geometry.translate(x, y, z)
		// this.object.position.set(x, y, z)
		// this.object.setRotationFromAxisAngle(Road.up, d.angle())
		// this.object.scale.set(len, 1, 1 * width) //
		this.uvs[0][2].set(len / width, 1)
		this.uvs[1][1].set(len / width, 0)
		this.uvs[1][2].set(len / width, 1)
		this.geometry.uvsNeedUpdate = true
		// this.view.addToLayer(Layer.All, this.object)
		const wire = new THREE.WireframeHelper(this.object)
		// console.log(wire)
		this.view.addToLayer(Layer.All, wire)
	}
}
import * as THREE from "three"
import { DistUnit, ObjectTag } from "../asset/def";
import { world2plain } from "../object/trans";
import { Thing, Layer } from "../wasp";

export default class Ground extends Thing<ObjectTag> {

	public readonly target = new THREE.WebGLRenderTarget(512, 512, {
		magFilter: THREE.LinearFilter,
		minFilter: THREE.LinearFilter,
		depthBuffer: false
	})

	private raycaster = new THREE.Raycaster()

	public readonly object: THREE.Mesh

	constructor(private readonly w: number, private readonly h: number) {
		super()

		let geometry = new THREE.PlaneGeometry(w * DistUnit, h * DistUnit, w, h)
		geometry.rotateX(-Math.PI / 2)
		geometry.translate(0, -1e-4, 0)
		let meshMaterial = new THREE.MeshLambertMaterial({
			// map: this.target.texture
			color: 0x666666
		})
		this.object = new THREE.Mesh(geometry, meshMaterial)

		this.view.addToLayer(Layer.All, this.object)
	}

	intersect(coord: { x: number, y: number }, camera: THREE.Camera): THREE.Vector2 | undefined {
		this.raycaster.setFromCamera(coord, camera)
		const ints = this.raycaster.intersectObject(this.object)
		if (!ints.length) return undefined
		return world2plain(ints[0].point)
	}

}
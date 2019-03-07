import * as THREE from "three"
import { DistUnit } from "../asset/def";

export default class Ground {

	public readonly target = new THREE.WebGLRenderTarget(512, 512, {
		magFilter: THREE.LinearFilter,
		minFilter: THREE.LinearFilter,
		depthBuffer: false
	})

	private raycaster = new THREE.Raycaster()

	public readonly object: THREE.Mesh

	constructor(private readonly w: number, private readonly h: number) {
		let geometry = new THREE.PlaneGeometry(w * DistUnit, h * DistUnit, w, h)
		geometry.rotateX(-Math.PI / 2)
		geometry.translate(0, -1e-4, 0)
		let meshMaterial = new THREE.MeshLambertMaterial({
			// map: this.target.texture
			color: 0x666666
		})
		this.object = new THREE.Mesh(geometry, meshMaterial)
	}

	intersect(coord: { x: number, y: number }, camera: THREE.Camera): THREE.Vector2 | undefined {
		this.raycaster.setFromCamera(coord, camera)
		const ints = this.raycaster.intersectObject(this.object)
		if (!ints.length) return undefined
		return ints[0].uv!.multiply(new THREE.Vector2(this.w, this.h))
			.sub(new THREE.Vector2(this.w, this.h).divideScalar(2))
			.multiply(new THREE.Vector2(1, -1))
	}

}
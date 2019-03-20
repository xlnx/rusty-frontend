import * as THREE from "three"
import { DistUnit, ObjectTag, CityLayer } from "../asset/def";
import { world2plain } from "../object/trans";
import { Thing, Layer, TexAsset } from "../wasp";
import { LODPlane } from "./lodPlane";

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

		let geometry = new LODPlane(3, 32, 0.02)
		//new THREE.PlaneGeometry(w * DistUnit, h * DistUnit, w, h)
		// geometry.rotateX(-Math.PI / 2)
		geometry.translate(0, -1e-4, 0)
		const texture = new TexAsset("textures/c.png").loadSync()
		let meshMaterial = new THREE.MeshStandardMaterial({
			// map: this.target.texture
			color: 0x666666,
			wireframe: true,
			displacementMap: texture,
			displacementScale: .5
		})
		this.object = new THREE.Mesh(geometry, meshMaterial)

		this.view.addToLayer(CityLayer.Origin, this.object)
	}

	intersect(coord: { x: number, y: number }, camera: THREE.Camera): THREE.Vector2 | undefined {
		this.raycaster.setFromCamera(coord, camera)
		const ints = this.raycaster.intersectObject(this.object)
		if (!ints.length) return undefined
		return world2plain(ints[0].point)
	}

}
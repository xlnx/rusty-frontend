import * as THREEJS from "three"
import * as THREE_ADDONS from "three-addons"
const THREE: typeof import("three") = { ...THREEJS, ...THREE_ADDONS }
import { RendererPrototype } from "./proto";

export class DirectRenderer extends RendererPrototype {

	public readonly orbit = new THREE.OrbitControls(
		this.camera, this.threeJsRenderer.domElement)

	constructor() {
		super()
		this.orbit.enableZoom = true
	}

	protected OnResize() {
		super.OnResize()
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
	}

	protected OnNewFrame() {
		this.threeJsRenderer.render(this.scene, this.camera)
		super.OnNewFrame()
	}
}
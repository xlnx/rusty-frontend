import RendererPrototype from "./proto";
import { OrbitControls } from "three-orbitcontrols-ts"

export default class DirectRenderer extends RendererPrototype {

	public readonly orbit = new OrbitControls(
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
import { DirectRenderer } from "./direct";

export class VRRendererPrototype extends DirectRenderer {

	private _valid: boolean = false
	get valid() { return this._valid }

	// private firstVRFrame = false
	private width: number = window.innerWidth
	private height: number = window.innerHeight

	private vr?: {
		display: VRDisplay,
		frameData: VRFrameData
	}

	constructor() {
		super()

		if (typeof VRFrameData === "undefined") {
			console.error("WebVR is not supported.")
			return
		}

		window.addEventListener("vrdisplayactivate", () => this.activateVR())
		window.addEventListener("vrdisplaydeactivate", () => this.deactivateVR())

		navigator.getVRDisplays().then(displays => {
			displays = displays.filter(display => display.capabilities.canPresent)

			if (displays.length == 0) {
				console.error("No devices available able to present.")
				return
			}

			this.vr = {
				display: displays[0],
				frameData: new VRFrameData()
			}

			this.vr.display.depthNear = this.camera.near
			this.vr.display.depthFar = this.camera.far

			this._valid = true
		})
	}

	private activateVR() {
		if (!this._valid || !this.vr!.display) return
		this.vr!.display.requestPresent([{
			source: this.threeJsRenderer.domElement
		}])
			.catch(e => console.error("Unable to init VR: ${e}"))
	}

	private deactivateVR() {
		if (!this._valid || !this.vr!.display.isPresenting) return
		this.vr!.display.exitPresent()
	}

	public toggleVR() {
		if (!this._valid) return
		if (this.vr!.display.isPresenting) return this.deactivateVR()
		return this.activateVR()
	}

	protected OnResize() {
		super.OnResize()

		this.width = window.innerWidth
		this.height = window.innerHeight
	}

	protected OnNewFrame() {
		if (!this._valid || !this.vr!.display.isPresenting) {
			this.OnResize()
			this.threeJsRenderer.autoClear = true
			this.scene.matrixAutoUpdate = true

			return super.OnNewFrame()
		}

		const EYE_WIDTH = this.width * 0.5
		const EYE_HEIGHT = this.height

		this.vr!.display.getFrameData(this.vr!.frameData)
		this.scene.matrixAutoUpdate = false
		this.threeJsRenderer.autoClear = false
		this.threeJsRenderer.clear()

		this.renderEye(
			this.vr!.frameData.leftViewMatrix,
			this.vr!.frameData.leftProjectionMatrix,
			{
				x: 0,
				y: 0,
				w: EYE_WIDTH,
				h: EYE_HEIGHT
			})

		this.threeJsRenderer.clearDepth()

		this.renderEye(
			this.vr!.frameData.rightViewMatrix,
			this.vr!.frameData.rightProjectionMatrix, {
				x: EYE_WIDTH,
				y: 0,
				w: EYE_WIDTH,
				h: EYE_HEIGHT
			})

		this.vr!.display.requestAnimationFrame(this.nextFrame)

		this.vr!.display.submitFrame()
	}

	private renderEye(viewMatrix: Float32Array,
		projectionMatrix: Float32Array, viewport: any) {
		this.threeJsRenderer.setViewport(
			viewport.x, viewport.y, viewport.w, viewport.h)
		this.camera.projectionMatrix.fromArray(<any>projectionMatrix)
		this.scene.matrix.fromArray(<any>viewMatrix)

		this.scene.updateMatrixWorld(true)
		this.threeJsRenderer.render(this.scene, this.camera)
	}
}
import * as THREE from "three"

export default class RendererPrototype {
	public readonly threeJsRenderer = new THREE.WebGLRenderer({ antialias: true })
	protected readonly nextFrame = () => this.update()

	private _started: boolean = false
	get started() { return this._started }

	protected readonly scene = new THREE.Scene()
	protected readonly camera = new THREE.PerspectiveCamera(
		75, window.innerWidth / window.innerHeight, 0.1, 1000)

	constructor() {
		this.threeJsRenderer.setPixelRatio(window.devicePixelRatio)
		this.threeJsRenderer.setSize(window.innerWidth, window.innerHeight)
		this.threeJsRenderer.setClearColor(0x000000, 1)
		document.body.appendChild(this.threeJsRenderer.domElement)
		this.OnResize()
	}

	protected OnUpdate() { }

	protected OnNewFrame() {
		requestAnimationFrame(this.nextFrame)
	}

	protected OnResize() {
		this.threeJsRenderer.setSize(window.innerWidth, window.innerHeight)
	}

	private update() {
		this.OnUpdate()
		this.OnNewFrame()
	}

	public start() {
		if (this.started) return
		this._started = true
		window.addEventListener("resize", () => this.OnResize())
		requestAnimationFrame(() => this.update())
	}
}
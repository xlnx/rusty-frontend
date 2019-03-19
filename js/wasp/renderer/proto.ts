import * as THREE from "three"
import * as dat from "dat.gui"
import { Scene } from "../basic";

export class RendererPrototype<T={}> {
	public readonly threeJsRenderer = new THREE.WebGLRenderer({ antialias: true })
	protected readonly nextFrame = () => this.update()

	protected readonly gui = new dat.GUI()

	private _started: boolean = false
	get started() { return this._started }

	protected readonly scene = new Scene<T>()
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
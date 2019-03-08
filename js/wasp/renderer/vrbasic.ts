import * as THREE from "three"
import * as dat from "dat.gui"
import { VRRendererPrototype } from "./vrproto";

export class VRRenderer extends VRRendererPrototype {

	protected readonly mouse = new THREE.Vector2()

	protected readonly gui = new dat.GUI()

	constructor() {
		super()

		window.addEventListener("mousemove", e => {
			this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
			this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
			this.OnMouseMove(e)
		})
		window.addEventListener("mousedown", e => this.OnMouseDown(e))
		window.addEventListener("mouseup", e => this.OnMouseUp(e))
	}

	protected OnMouseMove(e: MouseEvent) { }
	protected OnMouseDown(e: MouseEvent) { }
	protected OnMouseUp(e: MouseEvent) { }

}
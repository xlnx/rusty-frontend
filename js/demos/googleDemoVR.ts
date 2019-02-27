import * as THREE from "three"
import VRRendererPrototype from "../renderer/vrproto";

export default class GoogleDemoVR extends VRRendererPrototype {

	private box: THREE.Mesh

	constructor() {
		super()

		const WIDTH = 1
		const HEIGHT = 1
		const DEPTH = 1

		// Box.
		const boxGeometry = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH)
		const boxMaterial = new THREE.MeshNormalMaterial()

		this.box = new THREE.Mesh(boxGeometry, boxMaterial)
		this.box.position.z = -5

		// Room.
		const roomGeometry = new THREE.BoxGeometry(10, 2, 10, 10, 2, 10)
		const roomMaterial = new THREE.MeshBasicMaterial({
			wireframe: true,
			opacity: 0.3,
			transparent: true,
			side: THREE.BackSide
		})
		const room = new THREE.Mesh(roomGeometry, roomMaterial)

		room.position.z = -5

		this.scene.add(this.box)
		this.scene.add(room)
	}

	OnUpdate() {
		super.OnUpdate()

		const ROTATION_VALUE = 4;
		const time = window.performance.now() * 0.0001;

		this.box.rotation.x = Math.sin(time) * ROTATION_VALUE;
		this.box.rotation.y = Math.cos(time) * ROTATION_VALUE;
	}
}
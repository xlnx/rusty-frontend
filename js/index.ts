import * as wasm from "../pkg/crate"
import * as THREE from "three"
import VRRendererPrototype from "./renderer/vrproto"
import GoogleDemoVR from "./demos/googleDemoVR"

class MyRenderer extends VRRendererPrototype {

	constructor() {
		super()

		this.camera.position.z = 4
		let geometry = new THREE.PlaneGeometry(5, 5, 100, 100)
		let meshMaterial = new THREE.MeshPhongMaterial({
			color: 0x156289,
			emissive: 0x072534,
			side: THREE.DoubleSide,
			// displacementMap: g.texture,
			displacementScale: 1e-4,
			flatShading: true		// hard edges
		})
		let plain = new THREE.Mesh(geometry, meshMaterial)
		this.scene.add(plain)
		// plain.rotateX(Math.PI/2);
		plain.rotateX(2 * Math.PI / 3)

		let light = new THREE.PointLight(0xffffff, 1, 0)
		light.position.set(0, .5, .5)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		this.scene.add(lightHelper)
	}
}

let renderer = new GoogleDemoVR();
(<any>window)["renderer"] = renderer
renderer.start()


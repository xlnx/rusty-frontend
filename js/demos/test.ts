import * as THREE from "three"
import { VRRenderer } from "../wasp";
import { ObjectTag } from "../asset/def";
import { copy_f32_array_rs } from "../wasm/alloc";
import { Terrain } from "../object/terrain";

export default class CityDemoRenderer extends VRRenderer<ObjectTag> {

	private readonly plane: Terrain

	constructor() {

		super()

		// this.threeJsRenderer.shadowMap.enabled = true

		this.camera.position.z = 4

		// var light = new THREE.DirectionalLight(0xffffff, 1);
		// light.position.set(1, 1, 0); 			//default; light shining from top
		// this.scene.add(light);
		const light = new THREE.AmbientLight(0xffffff)
		this.scene.add(light)

		const axes = new THREE.AxesHelper(3)
		this.scene.add(axes)

		// //Set up shadow properties for the light
		// light.shadow.mapSize.width = 512;  // default
		// light.shadow.mapSize.height = 512; // default
		// light.shadow.camera.near = 0.5;    // default
		// light.shadow.camera.far = 500;     // default

		//Create a plane that receives shadows (but does not cast them)
		const planeGeometry = new THREE.PlaneBufferGeometry(20, 20, 32, 32)
		const planeMaterial = new THREE.MeshStandardMaterial({
			color: 0x00ff00,
			side: THREE.DoubleSide,
			wireframe: true
		})

		this.plane = new Terrain(this.threeJsRenderer, 20, 100, planeMaterial)

		// this.plane = new THREE.Mesh(planeGeometry, planeMaterial)
		this.plane
			.rotateX(Math.PI / 6)
			.scale.setScalar(10)
		// .rotateX(Math.PI / 2)
		// .scale(new THREE.Vector3(0.3))
		// plane.receiveShadow = true;
		this.scene.add(this.plane)

		//Create a helper for the shadow camera (optional)
		// const helper = new THREE.CameraHelper(light.shadow.camera);
		// this.scene.add(helper);
	}

	OnUpdate() {

		const isect = this.plane.intersect(this.mouse, this.camera)

		if (isect) {
			this.plane.morph({
				center: isect,
				radius: 5,
				speed: 1e3,
				dt: 0.1
			})
		}

		// const geo = <THREE.BufferGeometry>this.plane.geometry

		// const position = <THREE.BufferAttribute>geo.getAttribute("position")

		// console.log(position.array)
		// adjust(<Float32Array>position.array, 0.5, 0.5)
		// console.log(position.array)

		// position.needsUpdate = true
	}

	// OnNewFrame() {

	// 	this.pipeline.render()

	// 	requestAnimationFrame(this.nextFrame)
	// }
}
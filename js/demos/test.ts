import * as THREE from "three"
import { Pipeline, VRRenderer } from "../wasp";
import { ObjectTag } from "../asset/def";
import { VRStatefulRenderer } from "../wasp/renderer/vrstateful";

export default class CityDemoRenderer extends VRRenderer<ObjectTag> {

	// private pipeline = new Pipeline(this.threeJsRenderer)

	constructor() {

		super()

		this.threeJsRenderer.shadowMap.enabled = true

		this.camera.position.z = 4

		var light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(1, 1, 0); 			//default; light shining from top
		light.castShadow = true;            // default false
		this.scene.add(light);

		//Set up shadow properties for the light
		light.shadow.mapSize.width = 512;  // default
		light.shadow.mapSize.height = 512; // default
		light.shadow.camera.near = 0.5;    // default
		light.shadow.camera.far = 500;     // default

		//Create a sphere that cast shadows (but does not receive them)
		var sphereGeometry = new THREE.SphereBufferGeometry(5, 32, 32);
		var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
		var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
		sphere.castShadow = true; //default is false
		sphere.receiveShadow = false; //default
		this.scene.add(sphere);

		//Create a plane that receives shadows (but does not cast them)
		var planeGeometry = new THREE.PlaneBufferGeometry(20, 20, 32, 32).rotateX(Math.PI / 2);
		var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
		var plane = new THREE.Mesh(planeGeometry, planeMaterial);
		plane.receiveShadow = true;
		this.scene.add(plane);

		//Create a helper for the shadow camera (optional)
		var helper = new THREE.CameraHelper(light.shadow.camera);
		this.scene.add(helper);
	}

	// OnNewFrame() {

	// 	this.pipeline.render()

	// 	requestAnimationFrame(this.nextFrame)
	// }
}
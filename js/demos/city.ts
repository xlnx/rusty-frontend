import * as THREE from "three"
import Ground from "../object/ground";
import { RoadIndicator, Road } from "../object/road";
import { BuildingIndicator, Building } from "../object/building";
import { Basemap } from "../model/basemap";
import { BuildingManager } from "../asset/building";
import { VRRenderer, Pipeline, RenderStage, Scene, gBuffer, PostStage, Variable, Thing } from "../wasp";
import { ObjectTag, CityLayer, DistUnit } from "../asset/def";

import * as terrain from "./shaders/terrain.frag"
import { VRStatefulRenderer, VRState } from "../wasp/renderer/vrstateful";
import { SAOEffect, DepthLimitedBlurEffect, AccumulateShader, FXAAShader, SSAOEffect } from "../wasp/prefab";
import { PointIndicator } from "../model/point";
import { Object3D } from "three";

function updateDropdown(target, list) {
	let innerHTMLStr = "";
	for (var i = 0; i < list.length; i++) {
		var str = "<option value='" + list[i] + "'>" + list[i] + "</option>";
		innerHTMLStr += str;
	}

	if (innerHTMLStr != "") target.domElement.children[0].innerHTML = innerHTMLStr;
}

export default class CityDemoRenderer extends VRStatefulRenderer<ObjectTag> {

	private ground = new Ground(this.threeJsRenderer, 600).addTo(this.scene)
	// = new Ground(50, 50).addTo(this.scene)

	// gui controlled variables
	private readonly type: string = "Building_Restaurant"

	private basemap = new Basemap<Road, Building>()
	private manager = new BuildingManager()

	private pipeline = new Pipeline(this.threeJsRenderer)

	private guiOptions: { [key: string]: any } = {
		layer: 0,
		width: 1
	}

	private protos: string[] = []

	constructor() {

		super()

		// this.scene.add(new THREE.AxesHelper())

		const controlopt = this.gui.addFolder("control")
		controlopt.open()

		const type = controlopt.add(this, "type", this.protos)
			.onChange(() => this.postMsg({ type: "reload" }))
		controlopt.add(this.guiOptions, "width", [1, 2, 3, 4, 5, 6, 7, 8])
		controlopt.add(this.guiOptions, "layer", [0, 1, 2])
			.onChange((val: number) => this.camera.layers.set(val))

		this.addStates()

		this.manager.load([
			// "building2-obj"
			// "sketchfab/bar"

			"export/Building_Auto Service",
			"export/Building_Bakery",
			"export/Building_Bar",
			"export/Building_Books Shop",
			"export/Building_Chicken Shop",
			"export/Building_Clothing",
			"export/Building_Coffee Shop",
			"export/Building_Drug Store",
			"export/Building_Factory",
			"export/Building_Fast Food",
			"export/Building_Fruits  Shop",
			"export/Building_Gas Station",
			"export/Building_Gift Shop",
			"export/Building_House_01_color01",
			"export/Building_House_02_color01",
			"export/Building_House_03_color01",
			"export/Building_House_04_color01",
			"export/Building_Music Store",
			"export/Building_Pizza",
			"export/Building_Residential_color01",
			"export/Building_Restaurant",
			"export/Building_Shoes Shop",
			"export/Building Sky_big_color01",
			"export/Building Sky_small_color01",
			"export/Building_Stadium",
			"export/Building_Super Market"
		]).then(arr => {
			for (const proto of arr) {
				if (proto) {
					this.protos.push(proto.name)
					updateDropdown(type, this.protos)
					// console.log(this.protos)
				}
			}
		})

		this.camera.position.z = 4

		let light = new THREE.DirectionalLight(0xffffff)
		light.castShadow = true
		light.shadow.bias = 1e-4
		light.shadow.mapSize.set(8192, 8192)
		light.shadow.camera.bottom = -30
		light.shadow.camera.left = -30
		light.shadow.camera.top = 30
		light.shadow.camera.right = 30

		// new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.intensity = 0.5
		light.position.set(0, 1.5, 1)
		this.scene.add(light)
		// console.log(light)

		this.scene.add(new THREE.AmbientLight(0x666666))

		const amb = new THREE.AmbientLight(0xffffff)
		amb.intensity = 0.5
		this.scene.add(amb)

		// let lightHelper = new THREE.DirectionalLightHelper(light, 1000)
		// // let lightHelper = new THREE.PointLightHelper(light, 0.1)
		// lightHelper.layers.mask = 0xffffffff
		// this.scene.add(lightHelper)
		let helper = new THREE.CameraHelper(light.shadow.camera);
		this.scene.add(helper);

		const { width, height } = this.threeJsRenderer.getSize()

		const target = new THREE.WebGLRenderTarget(width, height, gBuffer)
		const final = target.clone()
		const depthTexture = new THREE.DepthTexture(width, height)
		depthTexture.type = THREE.UnsignedShortType
		depthTexture.minFilter = THREE.NearestFilter
		depthTexture.magFilter = THREE.NearestFilter
		target.depthTexture = depthTexture
		target.depthBuffer = true
		const normalTarget = new THREE.WebGLRenderTarget(width, height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat
		})

		const renderopt = this.gui.addFolder("render")
		renderopt.open()
		// const sao = {
		// 	bias: 0.3,
		// 	intensity: 2.7,
		// 	scale: 79,
		// 	kernelRadius: 28.1,
		// 	minResolution: 0
		// }
		// const saoEffect = new SAOEffect({
		// 	resolution: new THREE.Vector2(width, height).divideScalar(2).floor(),
		// 	depthTexture: depthTexture,
		// 	normalTexture: normalTarget.texture,
		// 	camera: this.camera,
		// 	uniforms: sao
		// })
		// const saoopt = renderopt.addFolder("sao")
		// saoopt.open()
		// saoopt.add(sao, "bias", -1, 1)
		// saoopt.add(sao, "intensity", 0, 10)
		// saoopt.add(sao, "scale", 0, 100)
		// saoopt.add(sao, "kernelRadius", 1, 50)
		// saoopt.add(sao, "minResolution", 0, 1)

		const ssao = {
			kernelRadius: 3 * DistUnit,
			minDistance: 0.04 * DistUnit,
			maxDistance: 0.4 * DistUnit,
		}
		const ssaoopt = renderopt.addFolder("ssao")
		ssaoopt.open()
		ssaoopt.add(ssao, "kernelRadius", 0, 1)
		ssaoopt.add(ssao, "minDistance", 0, 0.1)
		ssaoopt.add(ssao, "maxDistance", 0.01, 0.1)
		const ssaoEffect = new SSAOEffect({
			resolution: new THREE.Vector2(width, height).divideScalar(2).floor(),
			depthTexture: depthTexture,
			normalTexture: normalTarget.texture,
			camera: this.camera,
			uniforms: ssao
		})

		const blur = {
			resolution: new THREE.Vector2(width, height),
			depthTexture: depthTexture,
			image: ssaoEffect.textures[0],
			camera: this.camera,
			// radius: 6,
			// stddev: 8.5,
			// depthCutoff: 0.1
			radius: 3,
			stddev: 9.6,
			depthCutoff: 0.04
		}
		const blurEffect = new DepthLimitedBlurEffect(blur)
		const bluropt = renderopt.addFolder("blur")
		bluropt.open()
		bluropt.add(blur, "radius", 0, 100).step(1)
		bluropt.add(blur, "stddev", 1, 25)
		bluropt.add(blur, "depthCutoff", 0, 1)

		this.threeJsRenderer.shadowMap.enabled = true
		// (<any>this.threeJsRenderer).shadowMapSoft = true

		// this.threeJsRenderer.shadow

		const beauty = this.pipeline.begin
			.thenExec(() => {
				this.camera.layers.set(CityLayer.Origin)
				this.threeJsRenderer.autoClearColor = true
			})
			.then(new RenderStage(this.scene, this.camera), target)
		// .then(new PostStage({
		// 	uniforms: { depth: { value: depthTexture } },
		// 	fragmentShader: `
		// 	varying vec2 vUv;
		// 	uniform sampler2D depth;
		// 	void main() {
		// 		gl_FragColor = vec4(texture2D(depth, vUv).x);
		// 	}
		// 	`
		// }))

		const normal = beauty
			.then(new RenderStage(this.scene, this.camera, new THREE.MeshNormalMaterial()),
				normalTarget)
			.then(new PostStage(FXAAShader))
			.then(ssaoEffect)
			.then(blurEffect)
			.and(beauty)
			.then(new PostStage({
				fragmentShader: `
					varying vec2 vUv;
					void main() {
						vec4 tex = texture2D(iChannel[1], vUv);
						float a = texture2D(iChannel[0], vUv).r;
						gl_FragColor = mix(tex, tex * .4, 1.-a);
					}
					`
			}), final)
			.thenExec(() => {
				this.camera.layers.set(CityLayer.Indicator)
				this.threeJsRenderer.autoClearColor = false
			})
			.then(new RenderStage(this.scene, this.camera), final)
			.out()
	}

	private addStates() {
		const obj = { state: "preview" }
		this.gui.add(obj, "state", ["building", "road", "preview", "adjust"])
			.onChange(x => this.state = x)

		const self = this

		this.addState(new class extends VRState {
			constructor() { super("building") }

			private indicator?: BuildingIndicator

			OnMsg(e: { [key: string]: any }) {
				if (e.type = "reload") {
					this.indicator!.removeFrom(self.scene)
					this.indicator = new BuildingIndicator(
						self.manager.get(self.type)!, self.basemap).addTo(self.scene)
				}
			}

			OnEnter() {
				this.indicator = new BuildingIndicator(
					self.manager.get(self.type)!, self.basemap).addTo(self.scene)
			}

			OnLeave() {
				this.indicator!.removeFrom(self.scene)
			}

			OnMouseUp() {
				if (this.indicator && this.indicator.valid) {
					const b = new Building(this.indicator).addTo(self.scene)
					self.basemap.addBuilding(b.item)
				}
			}

			OnUpdate() {
				const coord = self.ground.intersect(self.mouse, self.camera)

				if (coord) {
					if (this.indicator) {
						const ind: BuildingIndicator = this.indicator
						ind.adjust(coord)
					}
				}
			}

		})

		this.addState(new class extends VRState {
			private aligning = false
			private coord: Variable | undefined
			private ptIdks = new Object3D()
			private scene = new Thing<ObjectTag>()
			private fromIdk
			private toIdk

			constructor() {
				super("road")
				this.ptIdks.position.set(0, 0, 0)
				this.scene.view.addToLayer(CityLayer.Indicator, this.ptIdks)
				self.scene.add(this.scene)
			}

			private indicator: RoadIndicator | undefined

			addPtIdks() {
				if (this.coord) {
					for (const pt of self.basemap.getCandidatePoints(this.coord.value)) {
						// console.log(pt)
						const ptIdk = new PointIndicator(this.ptIdks, pt, this.coord)
						this.coord.subscribe(() => {
							ptIdk.checkDist()
						})
					}
				}
			}

			OnLeave() {
				if (this.indicator) {
					this.indicator.removeFrom(self.scene)
					this.indicator = undefined
				}
			}

			OnMouseMove() {
				const pt = self.ground.intersect(self.mouse, self.camera)
				if (pt) {
					if (!this.coord) this.coord = new Variable(pt)
					else this.coord.value = pt

					//light candidate points
					this.addPtIdks()
					if (this.aligning) {
						this.indicator!.adjustTo(this.coord.value, true)
					}

					//draw mouse indicator

				}
			}

			OnMouseDown() {
				if (this.coord) {
					this.aligning = true
					if (!this.indicator) {
						this.coord.value = self.basemap.attachNearPoint(this.coord.value)
						this.indicator = new RoadIndicator(self.basemap,
							self.guiOptions.width, this.coord.value, this.coord.value).addTo(self.scene)
					}
				}
			}

			OnMouseUp() {
				if (this.indicator) {
					if (this.indicator.valid) {
						const { width } = self.guiOptions
						const { from, to } = this.indicator
						const { added, removed } = self.basemap.addRoad(width, from, to)
						for (const road of added) {
							road.userData = new Road(self.ground, width, road.from, road.to)
								.addTo(self.scene)
						}
						for (const road of removed) {
							road.userData!
								.removeFrom(self.scene)
						}
					}
					this.indicator.removeFrom(self.scene)
					this.indicator = undefined
				}
				this.aligning = false
			}

			OnUpdate() {
				// const coord = self.ground.intersect(self.mouse, self.camera)
				// if (coord) {
				// 	if (this.indicator) {
				// 		const ind: RoadIndicator = this.indicator
				// 		ind.adjust(coord)
				// 	}
				// }
			}
		})

		this.addState(new class extends VRState {
			constructor() { super("preview") }

			OnEnter() { self.orbit.enabled = true }
			OnLeave() { self.orbit.enabled = false }
		})

		this.addState(new class extends VRState {
			constructor() { super("adjust") }

			private enable = false

			OnLeave() { this.enable = false }
			OnMouseDown() { this.enable = true }
			OnMouseUp() { this.enable = false }

			OnTimer(millis: number) {
				if (millis % 10 == 0 && this.enable) {
					const coord = self.ground.intersect(self.mouse, self.camera)
					if (coord) {
						const { x, y } = coord.clone()
							.divideScalar(50)
							.addScalar(.5)
							.sub(new THREE.Vector2(0, 1))
							.multiply(new THREE.Vector2(1, -1))
							.multiplyScalar(512)
							.floor()
						// this.ground.applyDisplacementMap()
						self.ground.adjustHeight(coord, 10)
						// console.log(x, y)
					}
				}
			}
		})

		this.state = obj.state
	}

	OnNewFrame() {
		this.ground.updateLOD(this.camera)

		this.pipeline.render()

		requestAnimationFrame(this.nextFrame)
	}
}
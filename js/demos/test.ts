import * as THREE from "three"
import Ground from "../object/ground";
import { RoadIndicator, Road } from "../object/road";
import { BuildingIndicator, Building } from "../object/building";
import { Basemap } from "../model/basemap";
import { BuildingManager } from "../asset/building";
import { VRRenderer, Pipeline, RenderStage, Prefab, Scene, gBuffer, PostStage } from "../wasp";
import { ObjectTag, CityLayer } from "../asset/def";

import * as terrain from "./shaders/terrain.frag"
import { VRStatefulRenderer, VRState } from "../wasp/renderer/vrstateful";

export default class CityDemoRenderer extends VRStatefulRenderer<ObjectTag> {

	private ground = new Ground(this.threeJsRenderer, 600).addTo(this.scene)
	// = new Ground(50, 50).addTo(this.scene)

	// gui controlled variables
	private readonly type: "normalHouse" = "normalHouse"

	private basemap = new Basemap<Road, Building>()
	private manager = new BuildingManager()

	private pipeline = new Pipeline(this.threeJsRenderer)

	private guiOptions: { [key: string]: any } = {
		layer: 0,
		width: 1
	}

	constructor() {
		super()

		this.scene.add(new THREE.AxesHelper())

		this.gui.add(this, "type", ["normalHouse"])
		this.gui.add(this.guiOptions, "width", [1, 2, 3, 4, 5, 6, 7, 8])
		this.gui.add(this.guiOptions, "layer", [0, 1, 2])
			.onChange((val: number) => this.camera.layers.set(val))

		this.addStates()

		this.manager.load([
			"building2-obj/building_04.json"
		])

		this.camera.position.z = 4

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		this.scene.add(new THREE.AmbientLight(0x777777))

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		lightHelper.layers.mask = 0xffffffff
		this.scene.add(lightHelper)

		const { width, height } = this.threeJsRenderer.getSize()
		const target = new THREE.WebGLRenderTarget(width, height, gBuffer)

		this.pipeline.begin
			.thenExec(() => {
				this.camera.layers.set(CityLayer.Origin)
				this.threeJsRenderer.autoClearColor = true
			})
			.then(new RenderStage(this.scene, this.camera), target)
			.thenExec(() => {
				this.camera.layers.set(CityLayer.Indicator)
				this.threeJsRenderer.autoClearColor = false
			})
			.then(new RenderStage(this.scene, this.camera), target)
			.then(Prefab.FXAAShader)
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
			constructor() { super("road") }

			private indicator?: RoadIndicator

			OnLeave() {
				if (this.indicator) {
					this.indicator.removeFrom(self.scene)
					this.indicator = undefined
				}
			}

			OnMouseDown() {
				const point = self.ground.intersect(self.mouse, self.camera)
				if (point) {
					this.indicator = new RoadIndicator(self.basemap,
						self.guiOptions.width, point!, point!).addTo(self.scene)
				}
			}

			OnMouseUp() {
				if (this.indicator) {
					if (this.indicator.valid) {
						const { width } = self.guiOptions
						const { from, to } = this.indicator
						const { added, removed } = self.basemap.addRoad(width, from, to)
						for (const road of added) {
							road.userData = new Road(width, road.from, road.to)
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
			}

			OnUpdate() {
				const coord = self.ground.intersect(self.mouse, self.camera)

				if (coord) {
					if (this.indicator) {
						const ind: RoadIndicator = this.indicator
						ind.adjust(coord)
					}
				}
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
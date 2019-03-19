import * as THREE from "three"
import Ground from "../object/ground";
import { RoadIndicator, Road } from "../object/road";
import { BuildingIndicator, Building } from "../object/building";
import { Basemap } from "../model/basemap";
import { BuildingManager } from "../asset/building";
import { VRRenderer, Pipeline, RenderStage, Prefab, Scene, gBuffer } from "../wasp";
import { ObjectTag, CityLayer } from "../asset/def";

export default class CityDemoRenderer extends VRRenderer<ObjectTag> {

	private ground = new Ground(50, 50).addTo(this.scene)

	// gui controlled variables
	private readonly mode: "building" | "road" | "preview" = "preview"
	private oldmode = this.mode
	private readonly type: "normalHouse" = "normalHouse"
	private state: { [key: string]: any } = {}

	private basemap = new Basemap<Road, Building>()
	private manager = new BuildingManager()

	private pipeline = new Pipeline(this.threeJsRenderer)

	private guiOptions: { [key: string]: any } = {
		layer: 0,
		width: 1
	}

	private open(mode, state: { [key: string]: any }) {
		({
			preview: () => { this.orbit.enabled = true },
			road: () => { },
			building: () => {
				state.indicator = new BuildingIndicator(
					this.manager.get(this.type)!, this.basemap).addTo(this.scene)
			},
		}[mode])()
	}

	private close(mode, state: { [key: string]: any }) {
		({
			preview: () => { this.orbit.enabled = false },
			road: () => { !state.indicator || state.indicator.removeFrom(this.scene) },
			building: () => { !state.indicator || state.indicator.removeFrom(this.scene) },
		}[mode])()
	}

	constructor() {
		super()

		this.scene.add(new THREE.AxesHelper())

		this.gui.add(this, "type", ["normalHouse"])
		this.gui.add(this.guiOptions, "width", [1, 2, 3, 4, 5, 6, 7, 8])
		this.gui.add(this.guiOptions, "layer", [0, 1, 2])
			.onChange((val: number) => this.camera.layers.set(val))
		this.gui.add(this, "mode", ["building", "road", "preview"])
			.onChange(() => {
				const newState: { [key: string]: any } = {}
				this.close(this.oldmode, this.state)
				this.open(this.mode, newState)
				this.state = newState
				this.oldmode = this.mode
			})

		this.manager.load([
			"building2-obj/building_04.json"
		])

		this.camera.position.z = 4

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.layers.mask = 0xffffffff
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

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
				// this.threeJsRenderer.state.buffers.depth.setClear(0)
				// this.threeJsRenderer.state.buffers.depth.reset()
			})
			.then(new RenderStage(this.scene, this.camera), target)
			.then(Prefab.FXAAShader)
			.out()
	}

	protected OnMouseDown(e: MouseEvent) {
		if (this.mode == "road") {
			const point = this.ground.intersect(this.mouse, this.camera)
			if (point) {
				this.state.indicator = new RoadIndicator(this.basemap,
					this.guiOptions.width, point!, point!).addTo(this.scene)
			}
		}
	}

	// protected OnMouseMove(e: MouseEvent) {
	// 	const pt = this.ground.intersect(this.mouse, this.camera)
	// 	if (pt) {
	// 		console.log(this.basemap.roadID.get(this.basemap.selectRoad(pt)!))
	// 	}
	// }

	protected OnMouseUp(e: MouseEvent) {
		({
			road: () => {
				if (this.state.indicator) {
					if (this.state.indicator.valid) {
						const { width } = this.guiOptions
						const { from, to } = this.state.indicator
						const { added, removed } = this.basemap.addRoad(width, from, to)
						for (const road of added) {
							road.userData = new Road(width, road.from, road.to).addTo(this.scene)
						}
						for (const road of removed) {
							road.userData!.removeFrom(this.scene)
						}
					}
					this.scene.remove(this.state.indicator)
					this.state.indicator = undefined
				}
			},
			building: () => {
				if (this.state.indicator && this.state.indicator.valid) {
					const b = new Building(this.state.indicator).addTo(this.scene)
					this.basemap.addBuilding(b.item)
				}
			},
			preview: () => { }
		})[this.mode]()
	}

	OnUpdate() {
		super.OnUpdate()

		const coord = this.ground.intersect(this.mouse, this.camera)
		switch (this.mode) {
			case "road": {
				if (coord) {
					if (this.state.indicator) {
						const ind: RoadIndicator = this.state.indicator
						ind.adjust(coord)
					}
				}
				// 	if (coord) ind.to = coord
				// 	this.basemap.alignRoad(ind.item)
				// }
			} break
			case "building": {
				if (coord) {
					if (this.state.indicator) {
						const ind: BuildingIndicator = this.state.indicator
						ind.adjust(coord)
					}
				}
			} break
		}
	}

	OnNewFrame() {
		this.pipeline.render()

		requestAnimationFrame(this.nextFrame)
	}
}
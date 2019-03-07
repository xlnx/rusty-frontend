import * as THREE from "three"
import Selector from "../wrapper/selector"
import Indicator from "../2d/indicator";
import Ground from "../object/ground";
import Road from "../object/road";
import { BuildingIndicator, Building } from "../object/building";
import { Basemap } from "../model/basemap";
import VRRenderer from "../renderer/vrbasic";
import { BuildingManager } from "../asset/building";

export default class CityDemoRenderer1 extends VRRenderer {

	private selector = new Selector(this.scene)

	private ground = new Ground(50, 50)

	// gui controlled variables
	private readonly mode: "building" | "road" | "preview" = "preview"
	private oldmode = this.mode
	private readonly type: "normalHouse" = "normalHouse"
	private state: { [key: string]: any } = {}

	private basemap = new Basemap(Road)
	private manager = new BuildingManager()

	private open(mode, state: { [key: string]: any }) {
		({
			preview: () => { this.orbit.enabled = true },
			road: () => { },
			building: () => {
				state.indicator = new BuildingIndicator(
					this.manager.get(this.type)!, this.basemap)
				this.scene.add(state.indicator.object!)
			},
		}[mode])()
	}

	private close(mode, state: { [key: string]: any }) {
		({
			preview: () => { this.orbit.enabled = false },
			road: () => { !state.indicator || this.scene.remove(state.indicator.object) },
			building: () => this.scene.remove(state.indicator.object!),
		}[mode])()
	}

	constructor() {
		super()

		this.scene.add(new THREE.AxesHelper())

		this.gui.add(this, "type", ["normalHouse"])
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

		this.scene.add(this.ground.object)

		let light = new THREE.PointLight(0xffffff, 2, 0)
		light.position.set(0, 1.5, 1)
		this.scene.add(light)

		let lightHelper = new THREE.PointLightHelper(light, 0.1)
		this.scene.add(lightHelper)
	}

	protected OnMouseDown(e: MouseEvent) {
		if (this.mode == "road") {
			const point = this.ground.intersect(this.mouse, this.camera)
			if (point) {
				this.state.indicator = new Indicator(1, point!, point!)
				this.scene.add(this.state.indicator.object)
			}
		}
	}

	protected OnMouseUp(e: MouseEvent) {
		({
			road: () => {
				if (this.state.indicator) {
					const rs = this.basemap.addRoad(this.state.indicator.from, this.state.indicator.to)
					for (const r of rs) {
						this.scene.add((<any>r).object)
					}
					this.scene.remove(this.state.indicator.object)
					this.state.indicator = undefined
				}
			},
			building: () => {
				if (this.state.indicator) {
					// const res = this.basemap.alignBuilding(this.mouse, this.state.indicator.placeholder)
					// if (res) {
					// 	console.log("building added")
					// 	const { road: r, offset: o } = res
					// 	const b = new Building(this.manager.get(this.type)!, <Road>r, o)
					// 	this.basemap.addBuilding(b)
					// 	this.scene.add(b.object)
					// 	// this.scene.remove(this.state.indicator.object)
					// 	// this.state.indicator = undefined
					// }
				}
			},
			preview: () => { }
		})[this.mode]()
	}

	OnUpdate() {
		super.OnUpdate()

		switch (this.mode) {
			case "road": {
				if (this.state.indicator) {
					const ind: Indicator = this.state.indicator
					const coord = this.ground.intersect(this.mouse, this.camera)
					if (coord) ind.to = coord
					this.basemap.alignRoad(ind)
				}
			} break
			case "building": {
				const coord = this.ground.intersect(this.mouse, this.camera)
				if (coord) {
					if (this.state.indicator) {
						const ind: BuildingIndicator = this.state.indicator
						ind.adjust(coord)
					}
				}
			} break
		}
	}
}
import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit"
import { BuildingManagerComponent } from "./entity";

export class TestButtonComponent extends ComponentWrapper<{}> {

	constructor() {
		super("test-button")
	}

	init() {
		this.el.addEventListener("button-click", () => console.log("click"))
		this.el.addEventListener("button-up", () => console.log("up"))
		this.el.addEventListener("button-down", () => console.log("down"))
	}
}

new TestButtonComponent().register()

export class MainComponent extends ComponentWrapper<{}> {

	private buildingManager!: BuildingManagerComponent
	private splash!: AFrame.Entity

	private firstFinish = true

	constructor() { super("main", {}) }

	init() {

		this.buildingManager = window["building-manager"]
		this.splash = window["splash"]

		console.log(this.buildingManager)

		this.buildingManager.load(
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
		)

		this.splash.emit("enter")
	}

	tick() {

		this.splash.setAttribute("splash", {
			ratio: this.buildingManager.ratio
		})

		if (this.buildingManager.finish &&
			this.firstFinish) {

			this.firstFinish = false

			const city: AFrame.Entity = window["city-editor"]

			EntityBuilder.create("a-entity", {
				// scale: "1e-1 1e-1 1e-1",
				position: "0 0 -4",
				building: {
					name: "Building_Bar"
				},
				shadow: {
					cast: true,
					receive: true
				}
			})
				.attachTo(city)

			EntityBuilder.create("a-entity", {
				road: {
					from: { x: 5, y: 5 },
					to: { x: 10, y: 10 }
				}
			})
				.attachTo(city)
		}
	}
}

new MainComponent().register()

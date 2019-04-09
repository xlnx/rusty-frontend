import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit"
import "./building"
import "./ui"

export class MainComponent extends ComponentWrapper<{}> {

    private buildingManager!: AFrame.Entity
    private splash!: AFrame.Entity

    private firstFinish = true

    constructor() { super("main", {}) }

    init() {

        this.buildingManager = this.el.querySelector("[building-manager]")
        this.splash = <AFrame.Entity>this.el.sceneEl.querySelector("#splash_main")

        console.log(this.buildingManager)

        this.buildingManager.emit("load", [
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
        ])

        this.splash.emit("enter")
    }

    update() {

    }

    tick() {

        this.splash.setAttribute("splash", {
            ratio: this.buildingManager.components["building-manager"].data.ratio
        })

        if (this.buildingManager.components["building-manager"].data.finish &&
            this.firstFinish) {

            this.firstFinish = false

            const city = <AFrame.Entity>this.el.sceneEl.querySelector("#city_editor")

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
        }
    }
}

new MainComponent().register()

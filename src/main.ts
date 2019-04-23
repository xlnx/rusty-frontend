import { Component } from "./wasp";
import { BuildingManagerComponent } from "./entity";
import { RouterComponent } from "./control";

export class MainComponent extends Component<{}>{
    private buildingManager!: BuildingManagerComponent
    constructor() {
        super("main", {})
    }
    init() {
        this.buildingManager = window["building-manager"]
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

        this.el.setAttribute('router', {
            active: "login"
        })
    }
}

new MainComponent().register()
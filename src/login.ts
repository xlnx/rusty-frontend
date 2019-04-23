import { Component } from "./wasp";
import { BuildingManagerComponent } from "./entity";

export class LoginComponent extends Component<{}>{

    private buildingManager!: BuildingManagerComponent
    private splash!: AFrame.Entity

    constructor() {
        super("login", {})
    }

    init() {

        this.buildingManager = window["building-manager"]
        this.splash = window["splash"]

        this.subscribe(<AFrame.Entity>(this.el.parentElement), "router-enter", evt => {
            this.splash.emit("enter")
        })
    }

    tick() {

        this.splash.setAttribute("splash", {
            ratio: this.buildingManager.ratio
        })

    }
}

new LoginComponent().register()
import { Component } from "./wasp";
import { BuildingManagerComponent, BasemapComponent } from "./entity";
import { WebSocketComponent } from "./control";
import { MessageData } from "./web";

export class LoginComponent extends Component<{}>{

    private buildingManager!: BuildingManagerComponent
    private splash!: AFrame.Entity
    private socket!: WebSocketComponent
    private connectionEstablished: boolean = false
    private serverSynchronized = false
    private localSynchronized = true

    constructor() {
        super("login", {})
    }
    init() {
        this.buildingManager = window["building-manager"]
        this.splash = window["splash"]
        this.socket = window['socket']

        this.subscribe((<AFrame.Entity>this.el.parentElement), "router-enter", evt => {

            this.splash.emit("enter")
            // this.subscribe(this.socket.el, "receive", msg => {
            //     // setTimeout(() => {
            //         const { type, data } = msg.detail
            //         if (type == "Message" && data.info == "Accept") {
            //             // this.socket.el.emit("Data required")
            //         }
            //     })
            this.listen("Basemap synchronized", msg => {
                this.serverSynchronized = true
            })
            this.subscribe(this.socket.el, "established", msg => {
                this.connectionEstablished = true
            })
            this.subscribe(this.socket.el, "closed", msg => {
                this.connectionEstablished = false
            })
            this.listen("Basemap ready", () => {
                // console.log("rrr")
                this.socket.el.emit("Require data")
                console.log(" =========== require data here ====== ")
            })
            this.socket.el.emit("connect")
        })
    }

    tick() {
        let ratio = this.buildingManager.ratio
        if ((!this.connectionEstablished
            || !this.serverSynchronized
            || !this.localSynchronized
        )
            && ratio > 0.1) ratio -= 0.1
        this.splash.setAttribute("splash", {
            ratio: ratio
        })

    }
}

new LoginComponent().register()
import { Component } from "./wasp";
import { BuildingManagerComponent } from "./entity";
import { WebSocketComponent } from "./control";

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

            this.socket.el.emit("connect")
            this.subscribe(this.socket.el, "established", msg => {
                this.connectionEstablished = true
                this.socket.socket.send("HELLO WORLD")
            })
            this.subscribe(this.socket.el, "received", msg => {
                // setTimeout(() => {
                this.serverSynchronized = true
                console.log(msg.detail)
                // }, 5000)
            })
            this.subscribe(this.socket.el, "closed", msg => {
                this.connectionEstablished = false
            })
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
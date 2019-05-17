import { BuildingManagerComponent, BasemapComponent } from "./entity";
import { Component } from "./wasp";
import { WebSocketComponent } from "./control";
import * as UI from "./ui/def"
import { SynchronizationData } from "./web";
import { LoginComponent } from "./login";

export class GameComponent extends Component<{}> {

	private socket!: WebSocketComponent
	private initSync: boolean = false

	constructor() { super("game", {}) }

	init() {

		this.socket = window['socket']

		this.subscribe((<AFrame.Entity>this.el.parentElement), "router-enter", evt => {

		})
		this.socket.el.addEventListener("receive", msg => {
			setTimeout(() => {
				const { type, data } = (<any>msg).detail
				if (type == "Synchronization data") {
					try {
						const basemap: BasemapComponent = window['basemap']
						console.log("[Game] received data and importing... ")
						basemap.import(data)
						if (!this.initSync) {
							this.initSync = true
							const login: LoginComponent = window['login']
							login.el.emit("Basemap synchronized")
						}
					} catch (err) {
						console.log(`[Game] Fail to synchronize data: ${err}`)
					}
				}
			})
		})
		setTimeout(() => {
			const login: LoginComponent = window['login']
			login.el.emit("Basemap ready")
		}, 1000)
	}
}

new GameComponent().register()

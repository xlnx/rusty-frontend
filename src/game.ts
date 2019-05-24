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
		this.socket.el.addEventListener("receive", (msg:any) => {
			//const import_data = (msg: any) => {

			      console.log(msg.detail)
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
			//}

			//const query_import_data = (msg: any) => {
			//        const building_mgr = window["building-manager"]
			//	let data_ready = false
			//	if (building_mgr) {
			//	   console.log(building_mgr)
			  //          if (building_mgr.manager.ready) {
			//	       data_ready = true
			//	    }
			//	}
			//	if (!data_ready) {
			//	   console.log("query here")
			  //    	     setTimeout(() => { query_import_data(msg) }, 10)
			    //    } else {
			//	   console.log("import here")
			//	     import_data(msg)
			//	}
			//}			

			//setTimeout(() => { query_import_data(msg) }, 0)
		})
		const login_continue = () => {
		      const login = window["login"]
		      console.log("login continue here")
		      login.el.emit("Basemap ready")
		}
		const query_login_continue = () => {
		      console.log("login query here")
		      const building_mgr = window["building-manager"]
		     // console.log(building_mgr.ready)
		      let data_ready = false
		      //if (building_mgr != undefined) {
		      	 if (building_mgr.manager.ready) {
			    data_ready = true
			 }
		      //}
		      if (!data_ready) {
		      	 setTimeout(() => { query_login_continue() }, 10)
		      } else {
		      	login_continue()
		      }
		}

		setTimeout(query_login_continue, 10)
	}
}

new GameComponent().register()

import { Component } from "../wasp";

interface RoomComponentSchema {
	readonly enterEvent: string,
	readonly exitEvent: string,
	readonly current: boolean,
	readonly router: AFrame.Entity,
	readonly item: string
}

export class RoomComponent extends Component<RoomComponentSchema> {

	private static room: RoomComponent

	constructor() {

		super("room", {
			current: {
				type: "boolean",
				default: false
			},
			enterEvent: {
				type: "string",
				default: ""
			},
			exitEvent: {
				type: "string",
				default: ""
			},
			router: {
				type: "selector",
			},
			item: {
				type: "string",
				default: ""
			}
		})
	}

	init() {

		this.listen("enter", () => {
			const oldRoom = RoomComponent.room
			if (oldRoom) {
				const cb = () => {
					oldRoom.el.setAttribute("visible", false)
				}
				if (oldRoom.el.components.room.data.exitEvent != "") {
					oldRoom.el.emit(
						oldRoom.el.components.room.data.exitEvent, cb)
				} else {
					cb()
				}
			}
			const cb = () => {
				if (this.data.item) {
					this.data.router.setAttribute('router', {
						active: this.data.item
					})
				}
				this.el.setAttribute("visible", true)
			}
			if (this.data.enterEvent != "") {
				this.el.emit(this.data.enterEvent, cb)
			} else {
				cb()
			}
			RoomComponent.room = this
		})

		this.el.setAttribute("visible", this.data.current)
		if (this.data.current) {
			this.el.emit("enter")
		}
	}
}

new RoomComponent().register()

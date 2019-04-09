import { ComponentWrapper, EntityBuilder } from "aframe-typescript-toolkit";

interface SplashComponentSchema {
	readonly ratio: number,
	readonly dst: AFrame.Entity
}

const MAX_BALLS = 10
const DELAY_MS = 250

const SCALE_BEGIN = "1 1 1"
const SCALE_END = "1e-3 1e-3 1e-3"

const SCALE_WORLD = "1e-2 1e-2 1e-2"
// const SCALE_WORLD = "1 1 1"

export class SplashComponent extends ComponentWrapper<SplashComponentSchema> {

	private readonly balls: AFrame.Entity[] = []
	private readonly doors: AFrame.Entity[] = []
	// private readonly arms: AFrame.Entity[] = []

	private finished: boolean = true

	constructor() {

		super("splash", {
			ratio: {
				type: "number",
				default: 0
			},
			dst: {
				type: "selector"
			}
		})
	}

	update() {
		// console.log(this.data.ratio)
		if (!this.finished) {
			const s = this.data.ratio * MAX_BALLS
			for (let i = 0; i < Math.min(s, MAX_BALLS); ++i) {
				this.balls[i].emit("anim-expand")
			}
			if (this.data.ratio >= 1) {
				this.finished = true;
				setTimeout(() => {
					this.data.dst.emit("enter")
				}, DELAY_MS)
			}
		}
	}

	init() {

		this.el.addEventListener("enter", () => {
			if (this.finished) {

				this.finished = false

				for (const ball of this.balls) {
					ball.emit("anim-deflate")
				}

				this.el.setAttribute("splash", { ratio: 0 })
			}
		})

		this.el.addEventListener("anim-exit-room", (evt: any) => {
			const confirm = evt.detail
			for (const door of this.doors) {
				door.emit("anim-open")
			}
			setTimeout(confirm, 1000)
		})

		this.el.setAttribute("room", {
			exitEvent: "anim-exit-room"
		})

		const el = EntityBuilder.create("a-entity", {
			scale: SCALE_WORLD
		})
			.attachTo(this.el)
			.toEntity()

		EntityBuilder.create("a-light", {
			position: "0 0 100",
			color: "white",
			type: "point"
		})
			.attachTo(el)

		for (let i = 0; i < 4; ++i) {

			const r = 1e2

			const cont = EntityBuilder.create("a-entity", {
				rotation: `0 0 ${i * 90}`,
				position: `${i == 0 ? - r : i == 2 ? r : 0} 
				${i == 1 ? -r : i == 3 ? r : 0} -40`
			})
				.attachTo(el)
				.toEntity()

			const door = EntityBuilder.create("a-triangle", {
				material: {
					color: "white"
				},
				"vertex-a": `0 ${-r} 0`,
				"vertex-b": `${r} 0 0`,
				"vertex-c": `0 ${r} 0`,
				rotation: "0 0 0"
			})
				.attachTo(cont)
				.toEntity()

			door.addEventListener("anim-open", () => {
				door.setAttribute("animation", {
					property: "rotation",
					dir: "alternate",
					dur: 1000,
					easing: "easeInSine",
					loop: false,
					from: "0 0 0",
					to: "0 180 0"
				})
			})

			door.addEventListener("anim-close", () => {
				door.setAttribute("animation", {
					property: "rotation",
					dur: 0,
					loop: false,
					to: "0 0 0"
				})
			})

			this.doors.push(door)
		}

		const center = EntityBuilder.create("a-entity", {
			position: "0 0 -30",
			rotation: "90 0 0"
		})
			.attachTo(el)
			.toEntity()

		for (let i = 0; i < MAX_BALLS; ++i) {

			const rotate = `0 ${360 * i / MAX_BALLS} 0`
			const arm = EntityBuilder.create("a-entity", {
				rotation: rotate
			})
				.attachTo(center)
				.toEntity()

			const ball = EntityBuilder.create("a-entity", {
				geometry: { primitive: "circle" },
				material: {
					color: "black"
				},
				position: "4 0 0",
				scale: SCALE_BEGIN,
			})
				.set("billboard")
				.attachTo(arm)
				.toEntity()

			ball.addEventListener("anim-expand", () => {
				ball.setAttribute("animation", {
					property: "scale",
					dir: "alternate",
					dur: DELAY_MS,
					easing: "easeInSine",
					loop: false,
					from: SCALE_BEGIN,
					to: SCALE_END
				})
			})

			ball.addEventListener("anim-deflate", () => {
				ball.setAttribute("animation", {
					property: "scale",
					dur: 0,
					loop: false,
					to: SCALE_BEGIN
				})
			})

			this.balls.push(ball)
		}
	}
}

new SplashComponent().register()

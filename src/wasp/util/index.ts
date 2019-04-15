import { ComponentWrapper } from "aframe-typescript-toolkit";

export function async_foreach<T>(arr: T[], f: (e: T) => void) {

	const a = arr.map(e => e)
	const g = (x: number) => {
		if (x < a.length) {
			f(a[x]); setTimeout(g, 0, x + 1)
		}
	}
	setTimeout(g, 0, 0)
}

export interface EventController {

	readonly cancel: () => void

}

export abstract class Component<SCHEMA = {}, SYSTEM extends AFrame.System = AFrame.System>
	extends ComponentWrapper<SCHEMA, SYSTEM> {

	protected subscribe(producer: AFrame.Entity, event: string, subscriber: (evt: any) => void): EventController {

		const fn = (evt: any) => {

			if (producer.isPlaying && this.el.isPlaying) {
				subscriber(evt)
			}

		}

		producer.addEventListener(event, fn)

		return {
			cancel: () => producer.removeEventListener(event, fn)
		}

	}

	protected listen(event: string, listener: (evt: any) => void): EventController {

		const fn = (evt: any) => {

			if (this.el.isPlaying) {
				listener(evt)
			}

		}

		this.el.addEventListener(event, fn)

		return {
			cancel: () => this.el.removeEventListener(event, fn)
		}

	}
}

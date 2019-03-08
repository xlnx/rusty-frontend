import { Scene } from "./scene"
import { LayeredView } from "./layeredView"

export type ViewType<T> = LayeredView<T & { owner: Thing<T> }>

// namespace Wasp {
export class Thing<T extends {} = {}> {

	public readonly isThing = true
	public readonly view: ViewType<T>

	constructor(view?: LayeredView<T>) {
		if (!view) {
			this.view = new LayeredView<T & { owner: Thing<T> }>()
		} else {
			this.view = <ViewType<T>>view
		}
		this.view.tag.owner = this
		Scene.instance!.add(this)
	}

	destroy() {
		Scene.instance!.remove(this)
	}
}

// }
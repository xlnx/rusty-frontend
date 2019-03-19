import { Scene } from "./scene"
import { LayeredView } from "./layeredView"

type ThingProperty<T> = {
	owner: Thing<T>,
	id: number
}

export type ViewType<T> = LayeredView<T & { thing: ThingProperty<T> }>

// namespace Wasp {
export class Thing<T extends {} = {}> {

	private static thingID = 0

	public readonly isThing = true
	public readonly view: ViewType<T>

	constructor(view?: LayeredView<T>) {
		if (!view) {
			this.view = new LayeredView<T & { thing: ThingProperty<T> }>()
		} else {
			this.view = <ViewType<T>>view
		}
		this.view.tag.thing = {
			owner: this,
			id: Thing.thingID++
		}
		this.view.onBeforeRender = (
			renderer: THREE.WebGLRenderer,
			scene: THREE.Scene,
			camera: THREE.Camera,
			geometry: THREE.Geometry | THREE.BufferGeometry,
			material: THREE.Material,
			group: THREE.Group
		) => {
			const mat = <any>material
			if (mat.program) {
				const uniforms = mat.program.getUniforms().map
				if ("iThingID" in uniforms) {
					uniforms.iThingID.setValue(this.view.tag.thing.id)
				}
				// mat.program.getUniforms().map.id.setValue(this.view.tag.thing.id)
			}
		}
		Scene.instance!.add(this)
	}

	destroy() {
		console.log("destroyed object :", this)
		Scene.instance!.remove(this)
	}
}

// }
import { Terrain } from "./terrain";
import { DistUnit } from "../../legacy";
import { Component } from "../../wasp";

interface TerrainComponentSchema {
	readonly blockCnt: number,
	readonly worldWidth: number,
	readonly raycaster?: AFrame.Entity,
}

export class TerrainComponent extends Component<TerrainComponentSchema> {

	private readonly renderer = new THREE.WebGLRenderer()

	public readonly terrain!: Terrain

	private readonly point = new THREE.Vector2()

	constructor() {

		super("terrain", {
			blockCnt: {
				type: "number",
				default: 20
			},
			worldWidth: {
				type: "number",
				default: 200
			},
			raycaster: {
				type: "selector"
			}
		})
	}

	init() {

		// large terrain take time to init
		; (<any>this).terrain = new Terrain(this.el, this.renderer,
			this.data.blockCnt, this.data.worldWidth,
			new THREE.MeshStandardMaterial({
				color: 0x777777,
				wireframe: true
			}))

		const view = new THREE.Object3D()
		view.add(this.terrain)
		view.scale.setScalar(DistUnit)
		this.el.setObject3D("mesh", view)
	}

	tick() {

		this.terrain.updateLOD(this.el.sceneEl.camera)

		if (this.data.raycaster) {

			const raycaster: any = this.data.raycaster.components.raycaster

			if (raycaster) {

				const isects = raycaster.intersections

				if (isects.length) {

					const xy = this.terrain.coordCast(isects[0])

					this.point.set(xy.x, xy.y)

					this.el.emit("terrain-intersection-update", xy)

				}
			}
		}
	}

}

new TerrainComponent().register()

import { ComponentWrapper } from "aframe-typescript-toolkit";
import { Terrain } from "./terrain";
import { DistUnit } from "../../legacy";

interface TerrainComponentSchema {
	readonly blockCnt: number,
	readonly worldWidth: number
}

export class TerrainComponent extends ComponentWrapper<TerrainComponentSchema> {

	private readonly renderer = new THREE.WebGLRenderer()

	public readonly terrain!: Terrain

	constructor() {

		super("terrain", {
			blockCnt: {
				type: "number",
				default: 20
			},
			worldWidth: {
				type: "number",
				default: 200
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
	}
}

new TerrainComponent().register()

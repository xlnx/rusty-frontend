import { ComponentWrapper } from "aframe-typescript-toolkit";
import { Terrain } from "./terrain";

interface TerrainComponentSchema {
	readonly blockCnt: number,
	readonly worldWidth: number
}

export class TerrainComponent extends ComponentWrapper<TerrainComponentSchema> {

	private readonly renderer = new THREE.WebGLRenderer()

	private terrain!: Terrain

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
		this.terrain = new Terrain(this.renderer,
			this.data.blockCnt, this.data.worldWidth,
			new THREE.MeshStandardMaterial({
				color: 0x777777,
				wireframe: true
			}))

		this.el.setObject3D("mesh", this.terrain)
	}

	tick() {
		this.terrain.updateLOD(this.el.sceneEl.camera)
	}
}

new TerrainComponent().register()

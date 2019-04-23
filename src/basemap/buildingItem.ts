import { QuadTreeItem, UserData } from "./def";
import { AnyRect2D, minPt, maxPt, cmp } from "./geometry";
import BasemapRoadItem from "./roadItem";
import { BuildingPrototype } from "../entity/building/manager";

export default class BasemapBuildingItem<T = {}> extends UserData<T> {

	private _rect: AnyRect2D = <any>null
	private _quadTreeItem: QuadTreeItem<BasemapBuildingItem<T>> = <any>{}
	private shouldUpdate: boolean = true
	private readonly placeholder: THREE.Vector2

	constructor(
		public readonly proto: BuildingPrototype,
		// private readonly placeholder: THREE.Vector2,
		// readonly bbox2d: THREE.Box2,
		public readonly angle: number,
		public readonly road: BasemapRoadItem,
		public readonly offset: number//positive: leftside of the road
	) {
		super()
		this.placeholder = this.proto.placeholder
		this.checkUpdate()
	}

	set rectNeedsUpdate(flag: boolean) { this.shouldUpdate = flag }

	get rect(): AnyRect2D {
		this.checkUpdate()
		return this._rect
	}
	get quadTreeItem(): QuadTreeItem<BasemapBuildingItem<T>> {
		this.checkUpdate()
		return this._quadTreeItem
	}

	intersectRoad(road: BasemapRoadItem): boolean {
		return this.rect.intersect(road.rect)
	}

	intersectBuilding(building: BasemapBuildingItem<T>): boolean {
		return this.rect.intersect(building.rect)
	}

	private checkUpdate() {
		if (this.shouldUpdate) {
			this.shouldUpdate = false
			let offset = Math.abs(this.offset)
			let offsetSign = this.offset > 0 ? 1 : -1
			let houseRoadDir = this.road.to.clone().sub(this.road.from).normalize()
			let houseRoadNormDir = houseRoadDir.clone()
				.rotateAround(new THREE.Vector2(0, 0), Math.PI / 2 * offsetSign)
			let housePts = new Array<THREE.Vector2>()
			housePts[0] = this.road.from.clone()
				.add(houseRoadDir.clone().multiplyScalar(offset - 1))
				.add(houseRoadNormDir.clone().multiplyScalar(this.road.width / 2))
			housePts[1] = housePts[0].clone()
				.add(houseRoadDir.clone().multiplyScalar(this.placeholder.width))
			housePts[2] = housePts[1].clone()
				.add(houseRoadNormDir.clone().multiplyScalar(this.placeholder.height))
			housePts[3] = housePts[2].clone()
				.sub(houseRoadDir.clone().multiplyScalar(this.placeholder.width))
			this._rect = new AnyRect2D(housePts)

			//update QuadTreeItem
			Object.assign(this._quadTreeItem, { obj: this })
			Object.assign(this._quadTreeItem, this._rect.treeItem())
		}
	}
} 

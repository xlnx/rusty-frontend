import BasemapBuildingItem from "./buildingItem";
import { mapWidth, mapHeight, maxBuildings, maxRoads, QuadTreeItem, PointDetectRadius, AttachRadius, minRoadLength, defaultBuildingSelectionRange, defaultRoadSelectionRange } from "./def";
import { Point, AnyRect2D, cmp, ParallelRect2D, cmpPt, cross2D, Seg2D } from "./geometry";
import BasemapRoadItem from "./roadItem";
import * as QuadTree from "quadtree-lib"

type Restype<R> = {
	road: BasemapRoadItem<R> | undefined,
	offset: number | undefined,
	center: THREE.Vector2,
	angle: number,
	valid: boolean
}

class Basemap<R, B> {
	roadID = new Map<BasemapRoadItem<R>, number>()
	IDroad = new Map<number, BasemapRoadItem<R>>()
	static count = 0
	private readonly edge = new Map<Point, BasemapRoadItem<R>[]>()
	private readonly buildingTree: QuadTree<QuadTreeItem<BasemapBuildingItem<B>>> = new QuadTree({
		width: mapWidth,
		height: mapHeight,
		maxElements: maxBuildings
	})
	private readonly roadTree: QuadTree<QuadTreeItem<BasemapRoadItem<R>>> = new QuadTree({
		width: mapWidth,
		height: mapHeight,
		maxElements: maxRoads
	})

	addRoad(width: number, from: Point, to: Point): { added: BasemapRoadItem<R>[], removed: BasemapRoadItem<R>[] } {
		let res = {
			added: <BasemapRoadItem<R>[]>[],
			removed: <BasemapRoadItem<R>[]>[]
		}
		let newRoad = new BasemapRoadItem<R>(width, from, to)
		let segPts: Point[] = []
		let tempRoad: BasemapRoadItem<R>[] = []
		let treeItems = this.roadTree.colliding(newRoad.quadTreeItem)

		// let treeItems: any[] = []
		// this.roadTree.each(e => treeItems.push(e))

		for (let item of treeItems) {
			let road = item.obj!
			if (road.seg.intersect(newRoad.seg)) {
				let c = road.from
				let d = road.to
				let cd = d.clone().sub(c)
				let dist1 = newRoad.seg.distance(c)
				let dist2 = newRoad.seg.distance(d)
				let t = dist1 / (dist1 + dist2)
				if (isNaN(t)) {
					// console.log("isNaN")
					continue
				}
				let crossPt = c.clone().add(cd.clone().multiplyScalar(t))
				// console.log(Basemap.count)
				// console.log(crossPt)
				// let tes = { from: c, to: d, crossPoint: crossPt }

				//if the cross point is not C or D
				if (!cmpPt(crossPt, c) && !cmpPt(crossPt, d)) {
					// this.removeRoad(road)
					res.removed.push(road)
					tempRoad.push(new BasemapRoadItem<R>(road.width, c, crossPt))
					tempRoad.push(new BasemapRoadItem<R>(road.width, crossPt, d))
				}
				//otherwise, if cross point is C or D, nothing to do with line CD

				//if new this.RoadType is not segmented
				if (cmpPt(crossPt, from) || !cmpPt(crossPt, to)) continue
				segPts.push(crossPt)
			}
		}

		//remove segmented roads
		for (let road of res.removed)
			this.removeRoad(road)

		segPts.push(to)
		//sort pts by distance to fromPt
		segPts.sort((a, b): number => {
			return a.clone().sub(from).length() - b.clone().sub(from).length()
		})
		let From = from
		for (let pt of segPts) {
			let newRoad = new BasemapRoadItem<R>(width, From, pt)
			this.pushRoad(newRoad)
			res.added.push(newRoad)
			From = pt
		}
		for (let road of tempRoad) {
			this.pushRoad(road)
			res.added.push(road)
		}
		return res
	}

	private pushRoad(road: BasemapRoadItem<R>) {
		if (this.edge.has(road.from)) {
			this.edge.get(road.from)!.push(road)
		} else {
			this.edge.set(road.from, [road])
		}
		if (this.edge.has(road.to)) {
			this.edge.get(road.to)!.push(road)
		}
		else {
			this.edge.set(road.to, [road])
		}
		this.roadTree.push(road.quadTreeItem)

		this.roadID.set(road, Basemap.count)
		this.IDroad.set(Basemap.count, road)
		Basemap.count++
	}

	getAllRoads(): BasemapRoadItem[] {
		let res: BasemapRoadItem[] = []
		const items = this.roadTree.find(elm => true)
		if (items) items.forEach(item => res.push(item.obj))
		return res
	}
	getAllBuildings(): BasemapBuildingItem[] {
		let res: BasemapBuildingItem[] = []
		const items = this.buildingTree.find(elm => true)
		if (items) items.forEach(item => res.push(item.obj))
		return res
	}

	addBuilding(building: BasemapBuildingItem<B>) {
		this.buildingTree.push(building.quadTreeItem)
	}

	alignRoad(road: BasemapRoadItem<R>, lengthAssert: boolean = true): boolean {

		if (lengthAssert && cmp(road.seg.length(), minRoadLength) < 0) return false
		//detect building cross
		let intersectBuilding = this.buildingTree.colliding(road.quadTreeItem)
		for (let item of intersectBuilding) {
			let building = item.obj!
			if (building.intersectRoad(road))
				return false
		}

		//detect road cross
		const minAngle = Math.sqrt(2) / 2
		let intersectRoads = this.roadTree.colliding(road.quadTreeItem)
		for (let item of intersectRoads) {
			let r = item.obj!
			if (r.rect.intersect(road.rect)) {
				if (r.seg.ptOnLine(road.from) || r.seg.ptOnLine(road.to)) {
					if (cmp(r.seg.from.distanceTo(road.from), 0) == 0) {
						const ab = r.seg.to.clone().sub(road.from).normalize()
						const ac = road.to.clone().sub(road.from).normalize()
						if (cmp(ab.dot(ac), minAngle) <= 0) continue
					}
					else if (cmp(r.seg.from.distanceTo(road.to), 0) == 0) {
						const ab = r.seg.to.clone().sub(road.to).normalize()
						const ac = road.from.clone().sub(road.to).normalize()
						if (cmp(ab.dot(ac), minAngle) <= 0) continue
					}
					else if (cmp(r.seg.to.distanceTo(road.from), 0) == 0) {
						const ab = r.seg.from.clone().sub(road.from).normalize()
						const ac = road.to.clone().sub(road.from).normalize()
						if (cmp(ab.dot(ac), minAngle) <= 0) continue
					}
					else if (cmp(r.seg.to.distanceTo(road.to), 0) == 0) {
						const ab = r.seg.from.clone().sub(road.to).normalize()
						const ac = road.from.clone().sub(road.to).normalize()
						if (cmp(ab.dot(ac), minAngle) <= 0) continue
					}
					const aVec = r.from.clone()
						.sub(r.to)
						.normalize()
					const bVec = road.from.clone()
						.sub(road.to)
						.normalize();
					const sinValue = Math.abs((<any>aVec).cross(bVec));
					if (cmp(sinValue, minAngle) >= 0) continue
				}
				return false
			}
		}
		return true
	}

	static cnt = 0
	alignBuilding(pt: Point, placeholder: THREE.Vector2): Restype<R> {
		const nullval: Restype<R> = {
			road: undefined,
			offset: undefined,
			center: pt,
			angle: 0,
			valid: false
		}
		const road = this.getVerticalRoad(pt, Math.max(placeholder.width, placeholder.height) * 5)
		if (road) {

			if (road.seg.distance(pt) > (placeholder.height / 2 + road.width / 2) * 1.1) {
				return nullval
			}

			let AB = pt.clone().sub(road.from)
			let AC = road.to.clone().sub(road.from)
			let roadLength = AC.length()
			if (roadLength < placeholder.width) {
				return nullval
			}
			roadLength -= placeholder.width
			AC.normalize()

			let origin = new THREE.Vector2(0, 0)
			let faceDir = new THREE.Vector2(0, -1)

			//1: left, -1:right
			let offsetSign = cross2D(AC.clone(), (AB)) > 0 ? 1 : -1
			let offset = Math.round(AC.dot(AB) - placeholder.width / 2) + 1
			offset = cmp(offset, 1) < 0 ? 1 : cmp(offset, roadLength + 1) > 0 ? roadLength + 1 : offset

			let normDir = AC.clone().rotateAround(origin, Math.PI / 2 * offsetSign)
			let negNormDir = normDir.clone().negate()

			// let angle = Math.acos(faceDir.clone().dot(negNormDir)) * -offsetSign
			let angleSign = cmp(cross2D(negNormDir, faceDir), 0) > 0 ? -1 : 1
			let angle = Math.acos(negNormDir.dot(faceDir)) * angleSign
			let center = road.from.clone()
				.add(AC.clone().multiplyScalar(offset - 1 + placeholder.width / 2))
				.add(normDir.clone().multiplyScalar(placeholder.height / 2 + road.width / 2))
			// console.log("center:", center)
			let rect = new AnyRect2D([
				center.clone()
					.add(normDir.clone().multiplyScalar(placeholder.height / 2))
					.add(AC.clone().multiplyScalar(placeholder.width / 2)),
				center.clone()
					.add(negNormDir.clone().multiplyScalar(placeholder.height / 2))
					.add(AC.clone().multiplyScalar(placeholder.width / 2)),
				center.clone()
					.add(negNormDir.clone().multiplyScalar(placeholder.height / 2))
					.sub(AC.clone().multiplyScalar(placeholder.width / 2)),
				center.clone()
					.add(normDir.clone().multiplyScalar(placeholder.height / 2))
					.sub(AC.clone().multiplyScalar(placeholder.width / 2)),
			])

			offset *= offsetSign
			let res = <Restype<R>>{
				road: road,
				offset: offset,
				center: center,
				angle: angle,
				valid: true
			}

			let rectItem = rect.treeItem()
			//detect building cross
			let intersectBuilding = this.buildingTree.colliding(rectItem)
			intersectBuilding.forEach(item => {
				let building = item.obj!
				if (building.rect.intersect(rect)) {
					// console.log(`detect a building cross`)
					// console.log(building.rect)
					// console.log(rect)
					res!.valid = false
					return res
				}
			})

			//detect road cross
			let intersectRoad = this.roadTree.colliding(rectItem)
			for (let item of intersectRoad) {
				let r = item.obj!
				if (road == r) continue
				if (rect.intersect(r.rect)) {
					res!.valid = false
					// console.log(`road cross`)
					// console.log(this.roadID.get(road))
					return res
				}
			}
			return res
		}

		return nullval
	}

	// selectBuilding(pt: Point): Building | null
	removeBuilding(obj: BasemapBuildingItem<B>): BasemapBuildingItem<B> {
		const building = obj
		//remove Building in tree
		this.buildingTree.remove(obj.quadTreeItem)
		return obj
	}
	removeRoad(obj: BasemapRoadItem<R>): BasemapRoadItem<R> {
		const road = obj!
		//remove road in tree
		this.roadTree.remove(obj.quadTreeItem)

		//remove road in map
		for (let i = 0; i < this.edge.get(road.from)!.length; ++i) {
			let r = this.edge.get(road.from)![i]
			if (r.to == road.to) {
				this.edge.get(road.from)!.splice(i, 1)
				break
			}
		}
		for (let i = 0; i < this.edge.get(road.to)!.length; ++i) {
			let r = this.edge.get(road.to)![i]
			if (r.from == road.from) {
				this.edge.get(road.to)!.splice(i, 1)
				break
			}
		}

		const pt1 = this.edge.get(road.from)
		const idx1 = pt1.indexOf(road)
		pt1.splice(idx1, 1)
		if (pt1.length == 0) {
			this.edge.delete(road.from)
		}
		const pt2 = this.edge.get(road.to)
		const idx2 = pt2.indexOf(road)
		pt2.splice(idx2, 1)
		if (pt2.length == 0) {
			this.edge.delete(road.to)
		}
		return obj
	}

	private getBoxBuildingItems(pt: Point, distOfBox: number = defaultBuildingSelectionRange): QuadTreeItem<BasemapBuildingItem<B>>[] {
		return this.buildingTree.colliding({
			x: pt.x,
			y: pt.y,
			width: distOfBox,
			height: distOfBox
		})
		// return this.buildingTree.colliding({
		// 	x: pt.x,
		// 	y: pt.y,
		// 	width: distOfBox,
		// 	height: distOfBox
		// }, (elt1, elt2) => {
		// 	const pt1 = new THREE.Vector2(elt1.x, elt1.y)
		// 	const pt2 = new THREE.Vector2(elt2.x, elt2.y)
		// 	return pt1.distanceTo(pt2) <= distOfBox
		// })
	}

	selectBuilding(pt: Point, distOfBox: number = defaultBuildingSelectionRange): BasemapBuildingItem<B> | undefined {
		let res = this.getBoxBuilding(pt, distOfBox)
		if (res.rect.containPt(pt)) return res
	}

	getBoxBuilding(pt: Point, distOfBox: number = defaultBuildingSelectionRange): BasemapBuildingItem<B> | undefined {
		const items = this.getBoxBuildingItems(pt, distOfBox)
		let minDist = Infinity
		let res: BasemapBuildingItem<B> = undefined
		items.forEach((item: QuadTreeItem<BasemapBuildingItem<B>>) => {
			let building = item.obj!
			const dist = building.center.distanceTo(pt)
			if (dist < minDist) {
				minDist = dist
				res = building
			}
		})
		return res
	}

	private getBoxRoadItems(pt: Point, distOfBox: number = defaultRoadSelectionRange): QuadTreeItem<BasemapRoadItem<R>>[] {
		// console.log({
		// 	x: pt.x,
		// 	y: pt.y,
		// 	width: distOfBox,
		// 	height: distOfBox
		// })
		// return this.roadTree.colliding({
		// 	x: pt.x,
		// 	y: pt.y
		// }, (elt1, elt2) => {
		// 	const pt1 = new THREE.Vector2(elt1.x, elt1.y)
		// 	const pt2 = new THREE.Vector2(elt2.x, elt2.y)
		// 	return pt1.distanceTo(pt2) < distOfBox
		// })
		// return this.roadTree.colliding({
		// 	x: pt.x,
		// 	y: pt.y,
		// 	width: distOfBox,
		// 	height: distOfBox
		// })
		return this.roadTree.colliding({
			x: pt.x,
			y: pt.y,
			width: distOfBox,
			height: distOfBox
		}, (elt1, elt2) => {
			const box1 = new THREE.Box2(new THREE.Vector2(elt1.x - elt1.width / 2, elt1.y - elt1.height / 2), new THREE.Vector2(elt1.x + elt1.width / 2, elt1.y + elt1.height / 2))
			const box2 = new THREE.Box2(new THREE.Vector2(elt2.x - elt2.width / 2, elt2.y - elt2.height / 2), new THREE.Vector2(elt2.x + elt2.width / 2, elt2.y + elt2.height / 2))
			return box1.intersectsBox(box2) || box1.containsBox(box2) || box2.containsBox(box1)
		})
		// return this.roadTree.onc
	}

	selectRoad(pt: Point): BasemapRoadItem<R> | undefined {
		let res = this.getVerticalRoad(pt)
		if (res &&
			cmp(res.seg.distance(pt), res.width / 2) <= 0)
			return res
	}

	getBoxRoad(pt: Point, distOfBox: number = defaultRoadSelectionRange): BasemapRoadItem<R> | undefined {
		const items = this.getBoxRoadItems(pt, distOfBox)
		let minDist = Infinity
		let res: BasemapRoadItem<R> = undefined
		items.forEach((item: QuadTreeItem<BasemapRoadItem<R>>) => {
			let road = item.obj!
			if (road.seg.distance(pt) < minDist) {
				minDist = road.seg.distance(pt)
				res = road
			}
		})
		return res
	}

	getVerticalRoad(pt: Point, distOfBox: number = defaultRoadSelectionRange): BasemapRoadItem<R> | undefined {
		let res: BasemapRoadItem<R> = undefined
		let minDist = Infinity
		const items = this.getBoxRoadItems(pt, 2 * distOfBox)
		// console.log(this.roadTree)
		console.log("distOfBox:", distOfBox)
		console.log("all items:", items.length)
		// console.log("all roads:", this.getAllRoads().length)
		// console.log("all treeitems:", this.roadTree.find(e => true).length)
		items.forEach((item: QuadTreeItem<BasemapRoadItem<R>>) => {
			let road = item.obj!
			if (road.seg.distance(pt) < minDist) {
				const ap = pt.clone().sub(road.seg.from)
				const bp = pt.clone().sub(road.seg.to)
				const ab = road.seg.to.clone().sub(road.seg.from)
				const ba = ab.clone().negate()
				if (ap.dot(ab) > 0 && bp.dot(ba) > 0) {
					minDist = road.seg.distance(pt)
					res = road
				}
			}
		})
		return res
	}

	attachNearPoint(pt: Point): Point {
		const near = this.getCandidatePoint(pt)
		if (!cmpPt(near, pt) && near.distanceTo(pt) <= AttachRadius) return near
		else {
			const road = this.getVerticalRoad(pt, 2 * AttachRadius)
			if (road == undefined) return pt

			const nearPt = pt.clone()
			const farPt = pt.clone()
			const origin = new THREE.Vector2(0, 0)
			const dir = road.to.clone().sub(road.from).rotateAround(origin, Math.PI / 2).normalize()
			nearPt.add(dir.clone().multiplyScalar(2 * AttachRadius))
			farPt.add(dir.clone().negate().multiplyScalar(2 * AttachRadius))
			const newSeg = new Seg2D(nearPt, farPt)
			if (road.seg.intersect(newSeg)) {
				let c = road.from
				let d = road.to
				let cd = d.clone().sub(c)
				let dist1 = newSeg.distance(c)
				let dist2 = newSeg.distance(d)
				let t = dist1 / (dist1 + dist2)
				if (isNaN(t)) {
					return pt
				}
				let crossPt = c.clone().add(cd.clone().multiplyScalar(t))
				return crossPt
			}
			return pt
		}
	}

	getCandidatePoint(pt: Point): Point {
		let res: Point
		let minDist = Infinity
		for (const p of this.getCandidatePoints(pt)) {
			const dist = p.distanceTo(pt)
			if (dist < minDist) {
				minDist = dist
				res = p
			}
		}
		return res || pt
	}

	getCandidatePoints(pt: Point): Point[] {
		return this.getNearPoints(pt)
	}

	getNearPoints(pt: Point): Point[] {
		let res: Point[] = []
		let rect = new ParallelRect2D(pt, PointDetectRadius)
		//detect road cross
		let roads = this.roadTree.colliding(rect.treeItem())
		for (const item of roads) {
			const road = item.obj!
			if (pt.distanceTo(road.from.clone()) <= PointDetectRadius) res.push(road.from)
			if (pt.distanceTo(road.to.clone()) <= PointDetectRadius) res.push(road.to)
		}
		return res
	}

	getNearPoint(pt: Point): Point | undefined {
		let res: Point | undefined
		let minDist = Infinity
		for (const p of this.getNearPoints(pt)) {
			const dist = p.distanceTo(pt)
			if (dist < minDist) {
				minDist = dist
				res = p
			}
		}
		return res
	}
}

export {
	Basemap
}
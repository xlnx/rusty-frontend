import * as fs from "fs";
type RoadD = {
	from: number[],
	to: number[],
	width: number,
}
async function parseTopoRoad(): Promise<RoadD[]> {
	return new Promise((res, rej) => {
		const roads: [] = []
		const ret: RoadD[] = []
		let count = 0
		const { arcs, transform } = JSON.parse(fs.readFileSync('./src/basemap/cambridgeRoad.json', 'utf8'))
		const { scale, translate } = transform
		// console.log(scale, translate)
		arcs.forEach((argc: any[]) => {
			argc.forEach(pt => {
				pt[0] = (pt[0] - translate[0]) * scale[0] * 1000
				pt[1] = (pt[1] - translate[1]) * scale[1] * 1000
			})
			let from: number[] = undefined
			let to: number[]
			if (count < 1000) {
				argc.forEach(pt => {
					if (!from) {
						from = pt
						to = from
					}
					else {
						const delta = pt
						to = [to[0] + delta[0], to[1] + delta[1]]
					}
				})
				const length = Math.pow(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2), .5)
				if (length > 5) {
					ret.push({
						from: from,
						to: to,
						width: 1
					})
					++count
				}
			}
		})
		res(ret)
	})
}

// it("test", () => {
// 	parseTopoRoad().then(roads => {
// 		try {
// 			fs.writeFile("./assets/basemap/roads.json", JSON.stringify({ roads: roads }, null, 4), err => { console.log(err) })
// 		}
// 		catch (err) {
// 			console.log(`[Load road file] ${err}`)
// 		}
// 	})
// })
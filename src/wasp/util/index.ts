export function async_foreach<T>(arr: T[], f: (e: T) => void) {

	const a = arr.map(e => e)
	const g = (x: number) => {
		if (x < a.length) {
			f(a[x]); setTimeout(g, 0, x + 1)
		}
	}
	setTimeout(g, 0, 0)
}

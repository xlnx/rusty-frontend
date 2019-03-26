interface Loader {
	load(url: string, onLoad: (e: any) => void, onProgress: (e: any) => void, onError: (e: any) => void): void
}

export class PromiselifyLoader<T extends Loader> {

	constructor(
		public readonly wrapped: T,
		private readonly onProgress: (e: any) => void = () => { }
	) { }

	async load(url: string): Promise<any> {
		return new Promise((resolve, reject) => {
			this.wrapped.load(url, resolve, this.onProgress, reject)
		})
	}
}
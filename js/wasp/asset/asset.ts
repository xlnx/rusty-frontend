export abstract class Asset<T> {

	public static readonly path = "assets/"

	public static setPath(path: string) {
		(<any>Asset).path = path
	}

	get path() { return Asset.path + this._path }

	constructor(private readonly _path: string) { }

	abstract async load(): Promise<T>
}
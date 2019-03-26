export abstract class Asset<T> {

	public static readonly path = "assets/"

	public static setPath(path: string) {
		(<any>Asset).path = path
	}

	protected readonly _prefix: string
	protected readonly _shortName: string

	protected get prefix() { return Asset.path + this._prefix }
	protected get shortName() { return this._shortName }
	protected get path() { return Asset.path + this._path }

	constructor(protected readonly _path: string) {
		const idx = _path.lastIndexOf("/") + 1
		this._prefix = _path.substr(0, idx)
		this._shortName = _path.substr(idx)
	}

	abstract async load(): Promise<T>
}
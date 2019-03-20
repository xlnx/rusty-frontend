import { VRRenderer } from "./vrbasic";

export abstract class VRState {

	constructor(public readonly tag: string) { }

	OnEnter() { }
	OnLeave() { }

	OnMouseMove(e: MouseEvent) { }
	OnMouseDown(e: MouseEvent) { }
	OnMouseUp(e: MouseEvent) { }
	OnUpdate() { }
	OnTimer10() { }
	OnTimer100() { }
}

export class VRStatefulRenderer<T={}> extends VRRenderer<T> {

	private states = new Map<string, VRState>()
	private _state?: VRState
	private _tag?: string

	constructor() {
		super()

		const timer10 = setInterval(() => this.OnTimer10(), 100)
		const timer100 = setInterval(() => this.OnTimer100(), 100)
	}

	protected get state() { return this._tag! }
	protected set state(val: string) {
		if (this._tag != val) {
			if (this._tag) {
				this._state!.OnLeave()
			}
			this._tag = val
			this._state = this.states.get(this._tag)!
			this._state!.OnEnter()
		}
	}

	protected addState(state: VRState) {
		this.states.set(state.tag, state)
	}

	protected OnMouseDown(e: MouseEvent) {
		super.OnMouseDown(e)
		this._state!.OnMouseDown(e)
	}

	protected OnMouseMove(e: MouseEvent) {
		super.OnMouseMove(e)
		this._state!.OnMouseMove(e)
	}

	protected OnMouseUp(e: MouseEvent) {
		super.OnMouseUp(e)
		this._state!.OnMouseUp(e)
	}

	protected OnUpdate() {
		super.OnUpdate()
		this._state!.OnUpdate()
	}

	protected OnTimer100() {
		this._state!.OnTimer100()
	}

	protected OnTimer10() {
		this._state!.OnTimer10()
	}

}
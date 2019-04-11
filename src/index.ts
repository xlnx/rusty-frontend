import "./control"
import "./entity"
import "./ui"
import "./states"
import "./main"
import { ComponentWrapper } from "aframe-typescript-toolkit";

class TestComponent extends ComponentWrapper<{}> {

	constructor() { super("test", {}) }

	init() {
		const box: AFrame.Entity = window["box"]

		this.el.addEventListener("trackpadchanged", (evt: any) => {
			box.setAttribute()
		})
	}
}
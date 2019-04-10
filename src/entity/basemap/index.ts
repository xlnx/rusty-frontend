import { ComponentWrapper } from "aframe-typescript-toolkit";
import { Basemap } from "../../basemap/basemap";
import { Road } from "../road/road";

export class BasemapComponent extends ComponentWrapper<{}> {

	public readonly basemap: Basemap<Road, {}> = new Basemap()

	constructor() {
		super("basemap", {})
	}

}

new BasemapComponent().register()

import * as wasm from "../pkg/crate"
import MyRenderer from "./demos/city";
// import PlainDemoRenderer from "./demos/plain";

// let renderer = new GoogleDemoVR();
// let renderer = new CityDemoRenderer();
let renderer = new MyRenderer();
(<any>window)["renderer"] = renderer
renderer.start()

// import GUITest from "./demos/gui"
// new GUITest()


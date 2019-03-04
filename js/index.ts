import * as wasm from "../pkg/crate"
import GoogleDemoVR from "./demos/googleDemoVR"
import CityDemoRenderer from "./demos/city";
// import PlainDemoRenderer from "./demos/plain";

// let renderer = new GoogleDemoVR();
let renderer = new CityDemoRenderer();
(<any>window)["renderer"] = renderer
renderer.start()


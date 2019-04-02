extern crate wasm_bindgen;
use std::mem;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
	fn __do_allocate_f32_array_js(arr: &[f32]);
}

#[wasm_bindgen]
pub fn __do_allocate_f32_array_rs(len: usize) {
	let v: Vec<f32> = vec![0f32; len];
	__do_allocate_f32_array_js(&v[..]);
	mem::forget(v);
}

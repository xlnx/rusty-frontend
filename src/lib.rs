#[macro_use]
extern crate ref_thread_local;
use ref_thread_local::RefThreadLocal;

extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

ref_thread_local! {
    static managed Positions: Vec<&'static mut [f32]> = vec![];
}

pub mod alloc;

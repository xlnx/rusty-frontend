#[macro_use]
extern crate serde_derive;

extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct ExportedRustType {
    #[serde(alias = "str")]
    pub string: String,
    pub num: i32,
}

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn test_str(val: &str) {
    alert(val);
}

#[wasm_bindgen]
pub fn test_json(val: &JsValue) {
    let ty: ExportedRustType = val.into_serde().unwrap();
    alert(format!("{} : {}", ty.string, ty.num).as_str());
}

#[wasm_bindgen]
pub fn test_i32_mut_arr(val: &mut [f32]) {
    alert(format!("{}", val.len()).as_str());
    val[0] = 1f32;
}

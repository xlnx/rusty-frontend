export function main(wasm: typeof import("../pkg/crate")) {
	wasm.test_str("test_str");
	wasm.test_json({
		str: "test_json",
		num: 3
	})
	// wasm.greet("Rust!")
}

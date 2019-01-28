export function main(wasm: typeof import("../pkg/crate")) {
	wasm.greet("Rust!")
}

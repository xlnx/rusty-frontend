import { __do_allocate_f32_array_rs } from "../../pkg/crate";

type Float32ArrayRs = Float32Array

let this_arr!: Float32ArrayRs

(<any>window)["__do_allocate_f32_array_js"] = (arr: Float32Array) => {
	this_arr = <any>arr
}

export function new_f32_array_rs(len: number): Float32ArrayRs {
	__do_allocate_f32_array_rs(len)
	return this_arr
}

export function copy_f32_array_rs(src: Float32Array): Float32ArrayRs {
	const arr = new_f32_array_rs(src.length)
	arr.set(src)
	return arr
}


import("../pkg").then(wasm => {
	const { main } = require("./main")
	main(wasm)
})

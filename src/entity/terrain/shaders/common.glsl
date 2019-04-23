uniform float barrierScale;
uniform float worldWidth;
uniform vec2 blockId;
uniform vec2 blockDim;

vec2 getWorldPosition(vec2 uv) {
	vec2 buv = (uv - .5) / barrierScale + .5;
	return (buv + blockId) / blockDim * worldWidth;
}
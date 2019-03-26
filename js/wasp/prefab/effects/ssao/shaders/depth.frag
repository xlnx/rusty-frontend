#pragma glslify: import('../../util/packing.glsl')

varying vec2 vUv;

void main() {
	float depth = getLinearDepth( vUv );
	gl_FragColor = vec4( vec3( 1.0 - depth ), 1.0 );
}

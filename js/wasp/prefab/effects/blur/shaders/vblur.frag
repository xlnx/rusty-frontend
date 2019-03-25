varying vec2 vUv;
uniform sampler2D prev;

void main() {
	gl_FragColor = texture2D(prev, vUv);
}
uniform vec2 resolution;

void main() {
	vec2 tex = gl_FragCoord.xy / resolution;
	vec4 texel = texture2D(iStage, tex);
	gl_FragColor = vec4(0, 0, 1, 0.5) + texel;
}
uniform vec3 scale;

void main() {
	vec2 tex = gl_FragCoord.xy / iResolution;
	
	gl_FragColor = 
		texture2D(iChannel[0], tex) * vec4(scale, 1);
}
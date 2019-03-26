void main() {
	vec2 tex = gl_FragCoord.xy / iResolution;
	
	gl_FragColor = texture2D(iChannel[0], tex).gbra;
}
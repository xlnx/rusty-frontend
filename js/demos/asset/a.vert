void main() {
	gl_Position = 
		projectionMatrix * 
		modelViewMatrix * 
		vec4( position + normal * 0.1, 1 );
}
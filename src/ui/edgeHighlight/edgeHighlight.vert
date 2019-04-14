layout( location = INPUT_POSITION ) in vec3 position;
layout( location = INPUT_NORMAL ) in vec3 angularBisector;
layout( location = INPUT_TANGENT ) in vec2 blockIndex;

uniform mat4 matW, matV, matP;

out struct
{
	float id;
} var;

void main()
{
	float edgeWidth = 1e-3;
	// vec3 viewDirection = vec3( 0., 0., -1. );
	vec3 vertPosition = ( matV * matW * vec4( position, 1. ) ).xyz;
	vec3 vertNormal = ( matV * matW * vec4( angularBisector, 0. ) ).xyz;
	gl_Position = matP * vec4( vertPosition + edgeWidth * vertNormal, 1. );
	var.id = blockIndex.x;
}
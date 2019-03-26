uniform sampler2D tDepth;
uniform sampler2D tNormal;

uniform float cameraNear;
uniform float cameraFar;

uniform mat4 cameraProjectionMatrix;
uniform mat4 cameraInverseProjectionMatrix;

float getDepth( const in vec2 screenPosition ) {
	return texture2D( tDepth, screenPosition ).x;
}

float getLinearDepth( const in vec2 screenPosition ) {
	float fragCoordZ = texture2D( tDepth, screenPosition ).x;
	float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
	return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

float getViewZ( const in float depth ) {
	return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
}

vec3 getViewPosition( const in vec2 screenPosition, const in float depth, const in float viewZ ) {
	float clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];
	vec4 clipPosition = vec4( ( vec3( screenPosition, depth ) - 0.5 ) * 2.0, 1.0 );
	clipPosition *= clipW; // unprojection.
	return ( cameraInverseProjectionMatrix * clipPosition ).xyz;
}

vec3 getViewNormal( const in vec2 screenPosition ) {
	return unpackRGBToNormal( texture2D( tNormal, screenPosition ).xyz );
}
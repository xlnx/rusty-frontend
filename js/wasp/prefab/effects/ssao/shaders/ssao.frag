#pragma glslify: import('../../util/common.glsl')
#pragma glslify: import('../../util/packing.glsl')
#pragma glslify: import('../../util/perspective.glsl')

uniform sampler2D tNoise;

uniform vec3 kernel[ KERNEL_SIZE ];

uniform float kernelRadius;
uniform float minDistance; // avoid artifacts caused by neighbour fragments with minimal depth difference
uniform float maxDistance; // avoid the influence of fragments which are too far away

varying vec2 vUv;

void main() {

	float depth = getDepth( vUv );
	float viewZ = getViewZ( depth );

	vec3 viewPosition = getViewPosition( vUv, depth, viewZ );
	vec3 viewNormal = getViewNormal( vUv );

	vec2 noiseScale = vec2( iResolution.x / 4.0, iResolution.y / 4.0 );
	vec3 random = texture2D( tNoise, vUv * noiseScale ).xyz;

		// compute matrix used to reorient a kernel vector

	vec3 tangent = normalize( random - viewNormal * dot( random, viewNormal ) );
	vec3 bitangent = cross( viewNormal, tangent );
	mat3 kernelMatrix = mat3( tangent, bitangent, viewNormal );

	float occlusion = 0.0;

	for ( int i = 0; i < KERNEL_SIZE; i ++ ) {

		vec3 sampleVector = kernelMatrix * kernel[ i ]; // reorient sample vector in view space
		vec3 samplePoint = viewPosition + ( sampleVector * kernelRadius ); // calculate sample point

		vec4 samplePointNDC = cameraProjectionMatrix * vec4( samplePoint, 1.0 ); // project point and calculate NDC
		samplePointNDC /= samplePointNDC.w;

		vec2 samplePointUv = samplePointNDC.xy * 0.5 + 0.5; // compute uv coordinates

		float realDepth = getLinearDepth( samplePointUv ); // get linear depth from depth texture
		float sampleDepth = viewZToOrthographicDepth( samplePoint.z, cameraNear, cameraFar ); // compute linear depth of the sample view Z value
		float delta = sampleDepth - realDepth;

		if ( delta > minDistance && delta < maxDistance ) { // if fragment is before sample point, increase occlusion

			occlusion += 1.0;

		}

	}

	occlusion = clamp( occlusion / float( KERNEL_SIZE ), 0.0, 1.0 );

	gl_FragColor = vec4( vec3( 1.0 - occlusion ), 1.0 );
}

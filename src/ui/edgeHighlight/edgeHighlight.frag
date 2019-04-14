in struct
{
	float id;
} var;

out vec4 fragColor;

uniform sampler2D image;
uniform sampler2D stencil;
uniform sampler2D depth;

uniform vec2 resolution;

uniform int selectedId;

void main()
{
	vec2 texCoordinate = ( gl_FragCoord.xy ) / resolution;
	if ( var.id == float( selectedId ) && texture( stencil, texCoordinate ).r == 0 )
	{
		fragColor = vec4( 255. / 255., 185. / 255., 15. / 255., 1. );
		gl_FragDepth = 0.0;
	}
	else
	{
		gl_FragDepth = 1.0;
		fragColor = texture( image, texCoordinate );
	}
}
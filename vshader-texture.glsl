#version 300 es

in vec4 vPosition;
in vec4 vNormal;
in vec2 texCoord;

out vec2 ftexCoord;


out vec3 V;
out vec3 N;

//send veyepos to the fshader in order to calculate V and L
out vec4 veyepos;

uniform mat4 model_view;
uniform mat4 projection;

void main()
{

    veyepos = model_view*vPosition;
    V = normalize(-veyepos.xyz);
    N = normalize((model_view*vNormal).xyz);

    ftexCoord = texCoord;

    gl_Position = projection * veyepos;


}
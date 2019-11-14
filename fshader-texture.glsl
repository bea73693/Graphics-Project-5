#version 300 es
precision mediump float;

in vec2 ftexCoord; //interpolated texture coordinate for this fragment

in vec4 veyepos;
in vec3 V;
in vec3 N;

out vec4 fColor;

uniform vec4 light_color;
uniform vec4 light_position;
uniform vec4 ambient_light;
uniform sampler2D colorMap; //connected to memory with colors we can look up
uniform sampler2D specMap;

void main()
{
    vec3 fL = normalize(light_position.xyz - veyepos.xyz);
    vec3 fV = normalize(-veyepos.xyz);
    vec3 fH = normalize(fL+fV);
    vec3 fN = normalize(N);

    //ambiet light term
    vec4 amb = texture(colorMap, ftexCoord) * ambient_light;

    //diffuse term
    vec4 diff = max(0.0, dot(fL, fN)) * texture(colorMap, ftexCoord) * light_color;

    //specular term
    vec4 spec = pow(max(0.0, dot(fN, fH)), 15.0) * texture(specMap, ftexCoord) * light_color;

    if (dot(fL, fN) < 0.0){
        spec = vec4(0.0, 0.0, 0.0, 1);//no light on the backside, blinn-phong issue
    }


    fColor = amb + diff + spec;
    fColor.a = 1.0;
    //fColor = vec4(fH, 1.0);
}
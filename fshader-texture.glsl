#version 300 es
precision mediump float;

in vec2 ftexCoord; //interpolated texture coordinate for this fragment

in vec4 veyepos;
in vec3 V;
in vec3 N;
out vec4 fColor;

uniform int activeProgram;
uniform int drawClouds;
uniform vec4 light_color;
uniform vec4 light_position;
uniform vec4 ambient_light;
uniform sampler2D colorMap;
uniform sampler2D specMap;
uniform sampler2D nightMap;
uniform sampler2D cloudMap;

void allTextures();
void specTexture();
void nightTexture();
void cloudTexture();
void main()
{
    if(activeProgram == 1)
        allTextures();
    else if(activeProgram == 2)
        specTexture();

}
void allTextures(){
    if(drawClouds == 1){
        cloudTexture();
    }
    else {
        vec3 fL = normalize(light_position.xyz - veyepos.xyz);
        vec3 fV = normalize(-veyepos.xyz);
        vec3 fH = normalize(fL+fV);
        vec3 fN = normalize(N);
        //ambiet light term
        vec4 amb = (texture(colorMap, ftexCoord) * ambient_light)*max(0.0, dot(fL, fN)+1.0) +
        texture(nightMap, ftexCoord)*(max(0.0, -dot(fL, fN)));

        //diffuse term
        vec4 diff = max(0.0, dot(fL, fN)) * texture(colorMap, ftexCoord) * light_color;

        //specular term
        vec4 spec = pow(max(0.0, dot(fN, fH)), texture(specMap, ftexCoord).a * 20.0) * texture(specMap, ftexCoord) * light_color;

        if (dot(fL, fN) < 0.0){
            spec = vec4(0.0, 0.0, 0.0, 1.0);
        }

        fColor = amb + diff + spec;
        fColor.a = 1.0;
    }
}
void specTexture(){
    vec3 fL = normalize(light_position.xyz - veyepos.xyz);
    vec3 fV = normalize(-veyepos.xyz);
    vec3 fH = normalize(fL+fV);
    vec3 fN = normalize(N);

    vec4 spec = pow(max(0.0, dot(fN, fH)), texture(specMap, ftexCoord).a * 20.0) * texture(specMap, ftexCoord) * light_color;
    fColor = spec;
    fColor.a = 1.0;
}

void cloudTexture(){
    //fColor = texture(cloudMap, ftexCoord);
    vec3 fL = normalize(light_position.xyz - veyepos.xyz);
    vec3 fV = normalize(-veyepos.xyz);
    vec3 fH = normalize(fL+fV);
    vec3 fN = normalize(N);
    vec4 amb = texture(cloudMap, ftexCoord) * ambient_light;


    vec4 diff = max(0.0, dot(fL, fN)) * texture(cloudMap, ftexCoord) * light_color;
    fColor = amb + diff;
    fColor.a = texture(cloudMap, ftexCoord).a;

}

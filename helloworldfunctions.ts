"use strict";

import {initFileShaders, perspective, vec2, vec4, mat4, flatten, lookAt, translate,rotateX, rotateY, rotateZ, scalem} from './helperfunctions.js';
let gl:WebGLRenderingContext;
let program:WebGLProgram;
let vActiveProgram:WebGLUniformLocation;
let activeProgram:GLint;
let vCloudsActive:WebGLUniformLocation;
let drawClouds:GLint;
let disableClouds:boolean;

//uniform locations
let umv:WebGLUniformLocation; //uniform for mv matrix
let uproj:WebGLUniformLocation; //uniform for projection matrix

//shader variable indices for material properties
let vPosition:GLint;
let vTexCoord:GLint;
let vNormal:GLint;

let light_position:WebGLUniformLocation;
let light_color:WebGLUniformLocation;
let ambient_light:WebGLUniformLocation;

let uColorSampler:WebGLUniformLocation;//this will be a pointer to our sampler2D
let uSpecSampler:WebGLUniformLocation;
let uNightSampler:WebGLUniformLocation;
let uCloudSampler:WebGLUniformLocation;

//document elements
let canvas:HTMLCanvasElement;

//interaction and rotation state
let xAngle:number;
let yAngle:number;
let mouse_button_down:boolean = false;
let prevMouseX:number = 0;
let prevMouseY:number = 0;
let worldRotate:number = 0;

let worldtex:WebGLTexture;
let worldimage:HTMLImageElement;

let worldSpectex:WebGLTexture;
let worldSpecimage:HTMLImageElement;

let worldNighttex:WebGLTexture;
let worldNightimage:HTMLImageElement;

let worldCloudstex:WebGLTexture;
let worldCloudsimage:HTMLImageElement;


let anisotropic_ext;
let spherePoints:any[] = [];

window.onload = function init() {

    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement ;
    gl = canvas.getContext('webgl2', {antialias:true}) as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    //allow the user to rotate mesh with the mouse
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);

    //black background
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    program = initFileShaders(gl, "vshader-texture.glsl", "fshader-texture.glsl");

    gl.useProgram(program);
    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");
    light_position = gl.getUniformLocation(program, "light_position");
    light_color = gl.getUniformLocation(program, "light_color");
    ambient_light = gl.getUniformLocation(program, "ambient_light");

    vActiveProgram = gl.getUniformLocation(program, "activeProgram");
    vCloudsActive = gl.getUniformLocation(program, "drawClouds");

    uColorSampler = gl.getUniformLocation(program, "colorMap");//get reference to sampler2D
    uSpecSampler = gl.getUniformLocation(program, "specMap");
    uNightSampler = gl.getUniformLocation(program, "nightMap");
    uCloudSampler = gl.getUniformLocation(program, "cloudMap");

    //set up basic perspective viewing
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);


    //don't forget to load in the texture files to main memory
    initTextures();
    makeSphereAndBuffer();
    shaderEventListeners();
    activeProgram = 1.0;
    drawClouds = 1.0;
    disableClouds = false;

    //initialize rotation angles
    xAngle = 0;
    yAngle = 0;

    window.setInterval(update, 16);
};

function shaderEventListeners(){
    window.addEventListener("keydown" ,function(event){
        switch(event.key) {
            case "1":
                activeProgram = 1;
                break;
            case "2":
                activeProgram = 2;
                break;
            case "3":
                activeProgram = 3;
                break;
            case "c":
                if(disableClouds)
                    disableClouds = false;
                else
                    disableClouds = true;
                break;
        }
        requestAnimationFrame(render);
    });
}

function update(){
    worldRotate += .5;
    requestAnimationFrame(render);
}


//Make a square and send it over to the graphics card
function makeSphereAndBuffer(){

    let step:number = (360.0 / 200)*(Math.PI / 180.0);

    for (let lat:number = 0; lat <= Math.PI ; lat += step){ //latitude
        for (let lon:number = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            //triangle 1
            spherePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0)); //position
            spherePoints.push(new vec2(-lon/(2*Math.PI), lat/Math.PI));          //texture
            spherePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0)); //normal

            spherePoints.push(new vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 1.0));
            spherePoints.push(new vec2(-(lon+step)/(2*Math.PI), lat/Math.PI));
            spherePoints.push(new vec4(Math.sin(lat)*Math.cos(lon+step), Math.sin(lat)*Math.sin(lon+step), Math.cos(lat), 0.0));

            spherePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            spherePoints.push(new vec2(-(lon+step)/(2*Math.PI), (lat+step)/Math.PI));
            spherePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));

            //triangle 2
            spherePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 1.0));
            spherePoints.push(new vec2(-(lon+step)/(2*Math.PI), (lat+step)/Math.PI));
            spherePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon+step), Math.sin(lon+step)*Math.sin(lat+step), Math.cos(lat+step), 0.0));

            spherePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step), 1.0));
            spherePoints.push(new vec2(-lon/(2*Math.PI), (lat+step)/Math.PI));
            spherePoints.push(new vec4(Math.sin(lat+step)*Math.cos(lon), Math.sin(lat+step)*Math.sin(lon), Math.cos(lat+step),0.0));

            spherePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 1.0));
            spherePoints.push(new vec2(-lon/(2*Math.PI), lat/Math.PI));
            spherePoints.push(new vec4(Math.sin(lat)*Math.cos(lon), Math.sin(lon)*Math.sin(lat), Math.cos(lat), 0.0));
        }
    }

    //we need some graphics memory for this information
    let bufferId:WebGLBuffer = gl.createBuffer();
    //tell WebGL that the buffer we just created is the one we want to work with right now
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send the local data over to this buffer on the graphics card.  Note our use of Angel's "flatten" function
    gl.bufferData(gl.ARRAY_BUFFER, flatten(spherePoints), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 40, 0); //stride is 24 bytes total for position, texcoord
    gl.enableVertexAttribArray(vPosition);

    vTexCoord = gl.getAttribLocation(program, "texCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 40, 16); //stride is 24 bytes total for position, texcoord
    gl.enableVertexAttribArray(vTexCoord);

    vNormal = gl.getAttribLocation(program, 'vNormal');
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 40, 24);
    gl.enableVertexAttribArray(vNormal);
}

//update rotation angles based on mouse movement
function mouse_drag(event:MouseEvent){
    let thetaY:number, thetaX:number;
    if (mouse_button_down) {
        thetaY = 360.0 *(event.clientX-prevMouseX)/canvas.clientWidth;
        thetaX = 360.0 *(event.clientY-prevMouseY)/canvas.clientHeight;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        xAngle += thetaX;
        yAngle += thetaY;
    }
    requestAnimationFrame(render);
}

//record that the mouse button is now down
function mouse_down(event:MouseEvent) {
    //establish point of reference for dragging mouse in window
    mouse_button_down = true;
    prevMouseX= event.clientX;
    prevMouseY = event.clientY;
    requestAnimationFrame(render);
}

//record that the mouse button is now up, so don't respond to mouse movements
function mouse_up(){
    mouse_button_down = false;
    requestAnimationFrame(render);
}

function initTextures() {
    anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
    worldtex = gl.createTexture();
    worldimage = new Image();
    worldimage.onload = function() { handleTextureLoaded(worldimage, worldtex); };
    worldimage.src = 'Earth.png';

    worldSpectex = gl.createTexture();
    worldSpecimage = new Image();
    worldSpecimage.onload = function() { handleTextureLoaded(worldSpecimage, worldSpectex); };
    worldSpecimage.src = 'EarthSpec.png';

    worldNighttex = gl.createTexture();
    worldNightimage = new Image();
    worldNightimage.onload = function() { handleTextureLoaded(worldNightimage, worldNighttex); };
    worldNightimage.src = 'EarthNight.png';

    worldCloudstex = gl.createTexture();
    worldCloudsimage = new Image();
    worldCloudsimage.onload = function() { handleTextureLoaded(worldCloudsimage, worldCloudstex); };
    worldCloudsimage.src = 'earthcloudmap-visness.png';
}

function handleTextureLoaded(image:HTMLImageElement, texture:WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  //disagreement over what direction Y axis goes
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//draw a frame
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let p: mat4 = perspective(45, (canvas.clientWidth / canvas.clientHeight), 1, 20);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //position camera 5 units back from origin
    let camera: mat4 = lookAt(new vec4(0, 0, 5, 1), new vec4(0, 0, 0, 1), new vec4(0, 1, 0, 0));


    let mv: mat4 = camera.mult(rotateY(yAngle).mult(rotateX(xAngle)));
    gl.uniform4fv(light_position, mv.mult(new vec4(-10, 0, 5, 1)).flatten());
    mv = mv.mult(rotateY(worldRotate));
    mv = mv.mult(rotateX(90));
    mv = mv.mult(scalem(1.25, 1.25, 1.25));
    gl.uniformMatrix4fv(umv, false, mv.flatten());
    gl.uniform4fv(light_color, [.7, .7, .7, 1]);
    gl.uniform4fv(ambient_light, [.3, .3, .3, 1]);

    //send the modelview matrix over

    //make sure the appropriate texture is sitting on texture unit 0
    //we could do this once since we only have one texture per object, but eventually you'll have multiple textures
    //so you'll be swapping them in and out for each object
    gl.activeTexture(gl.TEXTURE0); //we're using texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, worldtex);

    gl.uniform1i(uColorSampler, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, worldSpectex);
    gl.uniform1i(uSpecSampler, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, worldNighttex);
    gl.uniform1i(uNightSampler, 2);
    gl.uniform1i(vActiveProgram, activeProgram);
    drawClouds = 0;
    gl.uniform1i(vCloudsActive, drawClouds);
    gl.drawArrays(gl.TRIANGLES, 0, spherePoints.length / 2);



    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.uniform1i(vCloudsActive, drawClouds);
    let mvCloud: mat4 = camera.mult(rotateY(yAngle).mult(rotateX(xAngle)));
    mvCloud = mvCloud.mult(rotateY(worldRotate/2));
    mvCloud = mvCloud.mult(rotateX(90));
    mvCloud = mvCloud.mult(scalem(1.26, 1.26, 1.26));


    gl.uniformMatrix4fv(umv, false, mvCloud.flatten());
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, worldCloudstex);
    gl.uniform1i(uCloudSampler, 3);

    drawClouds = 1;
    gl.uniform1i(vCloudsActive, drawClouds);
    if(!disableClouds && activeProgram != 2)
        gl.drawArrays(gl.TRIANGLES, 0, spherePoints.length / 2);
    gl.depthMask(true);
}

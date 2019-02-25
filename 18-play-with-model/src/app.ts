import { mat4, vec4, vec3 } from 'gl-matrix'
import renderLooper from 'render-looper';
import {
    ShaderProgram,
    GBuffer,
    OrbitCamera,
    loadTex,
    drawCube,
    // drawDragon,
    drawQuad,
    drawQuadDepthOne,
    ObjLoader,
    Mesh } from './gl-helpers/index';
import cubeVert from './shaders/cubeVert';
import cubeFrag from './shaders/cubeFrag';
import quadVert from './shaders/quadVert';
import quadFrag from './shaders/quadFrag';
import lightingFrag from './shaders/lightingFrag';
import testCubeFrag from './shaders/testCubeFrag';
import {
    getRadian } from './utils/index';
import { GBUFFER_TEXTURE_TYPE } from './enums/index';


const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2', {
    stencil: true
});
if (!gl) {
    throw 'This browser does not support webgl2.0';
}
gl.getExtension('EXT_color_buffer_float');

const { width: SCR_WIDTH, height: SCR_HEIGHT } = canvas.getBoundingClientRect();
gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);

const camera: OrbitCamera = new OrbitCamera(gl, 15, 0, 0);

const cubeShaderProgram: ShaderProgram = new ShaderProgram(gl, cubeVert, cubeFrag, 'cubeShaderProgram');
cubeShaderProgram.use();
cubeShaderProgram.uniform1i('cubeTex', 0);

const quadShaderProgram: ShaderProgram = new ShaderProgram(gl, quadVert, quadFrag, 'quadShaderProgram');
quadShaderProgram.use();
quadShaderProgram.uniform1i('tex', 0);
quadShaderProgram.uniform2f('screenSize', SCR_WIDTH, SCR_HEIGHT);

const lightingShaderProgram: ShaderProgram = new ShaderProgram(gl, quadVert, lightingFrag, 'lightingShaderProgram');
lightingShaderProgram.use();
lightingShaderProgram.uniform2f('screenSize', SCR_WIDTH, SCR_HEIGHT);
lightingShaderProgram.uniform1i('posTex', 0);
lightingShaderProgram.uniform1i('diffuseTex', 1);
lightingShaderProgram.uniform1i('normalTex', 2);

const testCubeShaderProgram: ShaderProgram = new ShaderProgram(gl, cubeVert, testCubeFrag, 'testCubeShaderProgram');
testCubeShaderProgram.use();
testCubeShaderProgram.uniform1i('cubeTex', 0);


const gBuffer: GBuffer = new GBuffer(gl, SCR_WIDTH, SCR_HEIGHT);

const cubeTexture: WebGLTexture = gl.createTexture();
loadTex('../images/wall.jpg', cubeTexture, gl);

const planetTexture: WebGLTexture = gl.createTexture();
loadTex('../models/planet_Quom1200.png', planetTexture, gl);

const stripTexture: WebGLTexture = gl.createTexture();
loadTex('../images/strip.jpg', stripTexture, gl);

gl.enable(gl.CULL_FACE);

const lightDir: vec3 = vec3.fromValues(1, 0, 0);
const lightRotSpeed: number = 5;
const selfRotSpeed: number = 0;
let selfRotAngle: number = 0;
function drawCB(msDt): void {
    cubeShaderProgram.use();
    const model: mat4 = mat4.create();
    // mat4.rotate(model, model, getRadian(-90), [1, 0, 0]);
    mat4.translate(model, model, [0, -6.0, 0]);
    mat4.rotate(model, model, getRadian(selfRotAngle += selfRotSpeed * msDt * 0.001), [0, 1, 0]);
    // mat4.scale(model, model, [1.5, 1.5, 1.5])
    mat4.scale(model, model, [0.25, 0.25, 0.25])
    const view: mat4 = camera.getViewMatrix();
    const perspective: mat4 = camera.getPerspectiveMatrix();

    cubeShaderProgram.uniformMatrix4fv('uModel', model);
    cubeShaderProgram.uniformMatrix4fv('uView', view);
    cubeShaderProgram.uniformMatrix4fv('uPerspective', perspective);

    gBuffer.setForGeomPass();
    // gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, planetTexture);
    gl.bindTexture(gl.TEXTURE_2D, stripTexture);
    // drawDragon(gl);
    if (dragonMesh) {
        dragonMesh.draw();
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    gBuffer.setForLightingPass();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(false);

    // 下面是为了只计算需要的片段的光照
    quadShaderProgram.use();
    gl.enable(gl.STENCIL_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.stencilFunc(gl.ALWAYS, 0, 0);
    // 将除物体外的背景的模板值自增1
    gl.stencilOp(gl.KEEP, gl.INCR, gl.KEEP);
    gl.drawBuffers([gl.NONE]);
    drawQuadDepthOne(gl);
    gl.depthFunc(gl.LESS);

    gl.drawBuffers([gl.COLOR_ATTACHMENT0])

    gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);
    // gl.disable(gl.DEPTH_TEST);

    lightingShaderProgram.use();
    // vec3.rotateY(lightDir, lightDir, [0, 0, 0], getRadian(msDt * 0.001 * lightRotSpeed));
    // lightingShaderProgram.uniform3fv('light_direction', lightDir);
    lightingShaderProgram.uniform3fv('light_direction', camera.getViewDirection());
    drawQuad(gl);

    gl.disable(gl.STENCIL_TEST);

    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    testCubeShaderProgram.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    const cubeModel: mat4 = mat4.create();
    // mat4.translate(cubeModel, cubeModel, [0, 0, -1]);
    mat4.scale(cubeModel, cubeModel, [1.6, 2.5, 2.5]);
    testCubeShaderProgram.uniformMatrix4fv('uModel', cubeModel);
    testCubeShaderProgram.uniformMatrix4fv('uView', view);
    testCubeShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    // drawCube(gl);
    
    gl.bindTexture(gl.TEXTURE_2D, null);

    gBuffer.setForOutput();
    gl.clear(gl.COLOR_BUFFER_BIT);
    quadShaderProgram.use();
    drawQuad(gl);
}

async function fetchObjFile(url: string) {
    const res = await window.fetch(url);
    const objTxt: string = await res.text();
    return ObjLoader.parseObjText(objTxt);   
}

let dragonMesh: Mesh = null;

// fetchObjFile('../models/planet.obj').then(({
fetchObjFile('../models/Tencent_BinHai.obj').then(({
    vertPosArray,
    vertUVArray,
    vertNormArray,
    vertIndexArray
}) => {
    dragonMesh = new Mesh(gl, vertPosArray, vertUVArray, vertNormArray, vertIndexArray);
})

const looper = new renderLooper(drawCB).start();

// setInterval(() => {
//     console.log(`Fps: ${looper.getFps()}`);
// }, 500);
import { vec3, mat4, vec2 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import { getContext, fetchObjFile, resizeCvs2Screen, getRadian } from './utils/index';
import { ShaderProgram, OrbitCamera, Texture, drawCube, ObjMesh, drawFakeBuilding, GBuffer, drawQuad } from './gl-helpers/index';
import phongVertSrc from './shaders/phongVert';
import pbrFrag from './shaders/pbrFrag';
import lightFrag from './shaders/lightFrag';
import lightVert from './shaders/lightVert';
import quadFrag from './shaders/quadFrag';
import quadVert from './shaders/quadVert';
import geoVert from './shaders/geoVert';
import geoFrag from './shaders/geoFrag';

const lightPositions: Array<Float32Array> = [
    new Float32Array([-10.0, 10.0, 10.0]),
    new Float32Array([10.0, 10.0, 10.0]),
    new Float32Array([-10.0, -10.0, 10.0]),
    new Float32Array([10.0, -10.0, 10.0]),
]

const lightWeight: number = 500.0;

const lightColors: Array<Float32Array> = [
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight])
];

const gl: WebGL2RenderingContext = getContext('#cvs');
gl.getExtension('EXT_color_buffer_float');

// 获得屏幕尺寸
const { width: SCR_WIDTH, height: SCR_HEIGHT } = resizeCvs2Screen(gl);

// TODO: 创建geo pass的shader program
const geoShaderProgram: ShaderProgram = new ShaderProgram(gl, geoVert, geoFrag, 'geoShaderProgram');
geoShaderProgram.use();
geoShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.5, 0.5]));
geoShaderProgram.uniform1f('ao', 1.0);
geoShaderProgram.uniform1f('roughness', 0.3);
geoShaderProgram.uniform1f('metallic', 1.0);

// TODO: 创建pbr lighting pass的shader program
const lightingShaderProgram: ShaderProgram = new ShaderProgram(gl, quadVert, pbrFrag, 'lightingShaderProgram');
lightingShaderProgram.use();
lightingShaderProgram.uniform1i('posTex', 0);
lightingShaderProgram.uniform1i('albedoTex', 1);
lightingShaderProgram.uniform1i('normalTex', 2);
lightingShaderProgram.uniform1i('metalTex', 3);
lightingShaderProgram.uniform1i('roughnessTex', 4);
lightingShaderProgram.uniform1i('aoTex', 5);
lightingShaderProgram.uniform2f('screenSize', SCR_WIDTH, SCR_HEIGHT);

for (let i = 0; i < 4; i++) {
    lightingShaderProgram.uniform3fv(`lightPositions[${i}]`, lightPositions[i]);
    lightingShaderProgram.uniform3fv(`lightColors[${i}]`, lightColors[i]);
}

// TODO: 最终输出使用的shader program
const outputShaderProgram: ShaderProgram = new ShaderProgram(gl, quadVert, quadFrag, 'outputShaderProgram');
outputShaderProgram.use();
outputShaderProgram.uniform1i('tex', 0);
outputShaderProgram.uniform2f('screenSize', SCR_WIDTH, SCR_HEIGHT);


const gBuffer: GBuffer = new GBuffer(gl, SCR_WIDTH, SCR_HEIGHT);

// 创建楼体mesh
const buildingMesh: ObjMesh = new ObjMesh(gl, '../models/Tencent_BinHai.obj');

// 创建相机
const camera: OrbitCamera = new OrbitCamera(gl, 45, 0, -30, SCR_WIDTH / SCR_HEIGHT);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

function drawCB(msDt: number, totalTime: number): void {

    camera.addYaw(0.1);
    const view: mat4 = camera.getViewMatrix();
    const perspective: mat4 = camera.getPerspectiveMatrix();

    // 几何pass
    gBuffer.setForGeomPass();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    geoShaderProgram.use();
    // 绘制腾讯大楼
    const model: mat4 = mat4.create();
    mat4.rotateY(model, model, getRadian(-45));
    mat4.scale(model, model, [0.25, 0.25, 0.25]);
    geoShaderProgram.uniformMatrix4fv('uModel', model);
    geoShaderProgram.uniformMatrix4fv('uView', view);
    geoShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    geoShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.5, 0.5]));    

    buildingMesh.draw();

    // 画建筑
    geoShaderProgram.use();
    geoShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.0, 0.0]));
    for (let model of buildingPoses) {
        geoShaderProgram.uniformMatrix4fv('uModel', model);
        drawFakeBuilding(gl);
    }

    // 光照pass
    gBuffer.setForLightingPass();
    gl.clear(gl.COLOR_BUFFER_BIT);
    lightingShaderProgram.use();
    lightingShaderProgram.uniform3fv('camPos', camera.position);
    drawQuad(gl);

    gBuffer.setForOutput();
    outputShaderProgram.use();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawQuad(gl);
}

const gridCnts: number = 30;
const gridSize: number = 5;
const buildingPoses: Array<mat4> = [];
function getRandom(start: number, end: number): number {
    return start + (end - start) * Math.random();
}

function generateBuildingPos(gridSize: number, gridCnts: number) {
    const halfWidth: number = gridSize * gridCnts * 0.5;
    // 列主序！！！
    const w2Checkerboard: mat4 = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        -halfWidth, 0, -halfWidth, 1
    );
    
    const discard: number = Math.floor(gridCnts * 0.5);
    
    for (let row = 0; row < gridCnts; row++) {
        for (let column = 0; column < gridCnts; column++) {
            if (row >= discard -2 && row <= discard && column >= discard - 2 && column <= discard) continue;
            const localMx: mat4 = mat4.create();
            mat4.translate(localMx, localMx, [column * gridSize + 0.5 * gridSize, row * gridSize + 0.5 * gridSize, 0]);
            mat4.rotateX(localMx, localMx, getRadian(-90));
            mat4.rotateY(localMx, localMx, getRadian(90 * Math.random()));
            mat4.scale(localMx, localMx, [0.5 * gridSize, 0.5 * gridSize, 0.5 * gridSize]);
            mat4.scale(localMx, localMx, [getRandom(0.3, 0.5), getRandom(0.5, 1.5), getRandom(0.4, 0.6)])
            const finalModelMx: mat4 = mat4.create();
            mat4.multiply(finalModelMx, w2Checkerboard, localMx);
            buildingPoses.push(finalModelMx);
        }
    }    
}

interface LightInfo {
    lightPos: vec3;
    lightColor: vec3;
    lightId: vec2;
}

function generateLights(gridSize: number, gridCnts: number, freeLights: Array<LightInfo>): void {
    const halfWidth: number = gridSize * gridCnts * 0.5;
    for (let row = 0; row < gridCnts; row++) {
        for (let col = 0; col < gridCnts; col++) {
            // if (Math.random() < 0.3) {
                const pos: vec3 = vec3.fromValues(-halfWidth + col * gridSize, 5, -halfWidth + row * gridSize)
                const currentIdx: number = row * gridCnts + col;
                const lightColor: vec3 = vec3.fromValues(
                    (Math.sin(3.45 * currentIdx * 0.01) * 0.5 + 0.5) * 10,
                    (Math.sin(6.56 * currentIdx * 0.01) * 0.5 + 0.5) * 10,
                    (Math.sin(8.78 * currentIdx * 0.01) * 0.5 + 0.5) * 10,
                )
                freeLights.push({
                    lightPos: pos,
                    lightColor,
                    lightId: vec2.fromValues(col, row)
                })
            // }
        }
    }
}

const freeLights: Array<LightInfo> = [];
generateLights(gridSize, gridCnts, freeLights);

generateBuildingPos(gridSize, gridCnts);

const looper = new RenderLooper(drawCB).start();

window.addEventListener('resize', function() {
    const { width, height } = resizeCvs2Screen(gl);
    camera.updateRatio(width / height);
}, false);

setInterval(function() {
    console.log('fps: ', looper.getFps());
}, 1000);
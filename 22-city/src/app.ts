import { vec3, mat4 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import { getContext, fetchObjFile, resizeCvs2Screen, getRadian } from './utils/index';
import { ShaderProgram, Mesh, loadTex, OrbitCamera, Texture, drawCube, ObjMesh } from './gl-helpers/index';
import phongVertSrc from './shaders/phongVert';
import pbrFrag from './shaders/pbrFrag';
import lightFrag from './shaders/lightFrag';

const lightPositions: Array<Float32Array> = [
    new Float32Array([-10.0, 10.0, 10.0]),
    new Float32Array([10.0, 10.0, 10.0]),
    new Float32Array([-10.0, -10.0, 10.0]),
    new Float32Array([10.0, -10.0, 10.0]),
]

const lightWeight: number = 300.0;

const lightColors: Array<Float32Array> = [
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight]),
    new Float32Array([lightWeight, lightWeight, lightWeight])
];

const gl: WebGL2RenderingContext = getContext('#cvs');
gl.getExtension('EXT_color_buffer_float');

// 获得屏幕尺寸

// 创建shaderprogram

const pbrShaderProgram: ShaderProgram = new ShaderProgram(gl, phongVertSrc, pbrFrag, 'pbrShaderProgram');
pbrShaderProgram.use();
pbrShaderProgram.uniform3fv('albedo', new Float32Array([0.5, 0.0, 0.0]));
pbrShaderProgram.uniform1f('ao', 1.0);
pbrShaderProgram.uniform1f('roughness', 0.3);
pbrShaderProgram.uniform1f('metallic', 1.0);

for (let i = 0; i < 4; i++) {
    pbrShaderProgram.uniform3fv(`lightPositions[${i}]`, lightPositions[i]);
    pbrShaderProgram.uniform3fv(`lightColors[${i}]`, lightColors[i]);
}

const lightShaderProgram: ShaderProgram = new ShaderProgram(gl, phongVertSrc, lightFrag, 'lightShaderProgram');
lightShaderProgram.use();
lightShaderProgram.uniform1i('tex', 0);

const { width: SCR_WIDTH, height: SCR_HEIGHT } = resizeCvs2Screen(gl);

const lightTexture: Texture = new Texture(gl, '../images/wall.jpg', gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

// 创建楼体mesh
const buildingMesh: ObjMesh = new ObjMesh(gl, '../models/Tencent_BinHai.obj');

// 创建相机
const camera: OrbitCamera = new OrbitCamera(gl, 45, 0, -30, SCR_WIDTH / SCR_HEIGHT);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.0, 0.0, 0.0, 1.0);

function drawCB(msDt: number): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // camera.addYaw(0.5);
    const view: mat4 = camera.getViewMatrix();
    const perspective: mat4 = camera.getPerspectiveMatrix();
    const model: mat4 = mat4.create();
    mat4.translate(model, model, [0, -6.0, 0]);
    mat4.rotateY(model, model, getRadian(-45));
    mat4.scale(model, model, [0.25, 0.25, 0.25]);

    pbrShaderProgram.use();
    pbrShaderProgram.uniformMatrix4fv('uModel', model);
    pbrShaderProgram.uniformMatrix4fv('uView', view);
    pbrShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    pbrShaderProgram.uniform3fv('camPos', camera.position);

    buildingMesh.draw();

    // 画出光源的位置
    lightShaderProgram.use();
    lightShaderProgram.uniformMatrix4fv('uView', view);
    lightShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    for (let i = 0; i < 4; i++) {
        const model: mat4 = mat4.create();
        const pos: vec3 = vec3.fromValues(lightPositions[i][0], lightPositions[i][1], lightPositions[i][2]);
        mat4.translate(model, model, pos);
        lightShaderProgram.uniformMatrix4fv('uModel', model);
        lightShaderProgram.uniform3fv('lightColor', lightColors[i]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lightTexture.tex);
        drawCube(gl);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    lightShaderProgram.uniform3fv('lightColor', new Float32Array([100.0, 100.0, 100.0]));
    pbrShaderProgram.use();
    for (let model of buildingPoses) {
        pbrShaderProgram.uniformMatrix4fv('uModel', model);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lightTexture.tex);
        drawCube(gl);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}

interface Pos {
    x: number;
    y: number;
}

const gridCnts: number = 30;
const buildingPoses: Array<mat4> = [];
function getRandom(start: number, end: number): number {
    return start + (end - start) * Math.random();
}

function generateBuildingPos(gridSize: number, gridCnts: number) {
    const halfWidth: number = gridSize * gridCnts * 0.5;
    console.log(halfWidth);
    // 列主序！！！
    const w2Checkerboard: mat4 = mat4.fromValues(
        1, 0, 0, 0,
        0, 0, 1, 0,
        0, -1, 0, 0,
        -halfWidth, 0, -halfWidth, 1
    );

    
    for (let row = 0; row < gridCnts; row++) {
        for (let column = 0; column < gridCnts; column++) {
            const localMx: mat4 = mat4.create();
            mat4.translate(localMx, localMx, [column * gridSize + 0.5 * gridSize, row * gridSize + 0.5 * gridSize, 0]);
            mat4.scale(localMx, localMx, [gridSize, gridSize, gridSize]);
            mat4.scale(localMx, localMx, [getRandom(0.5, 1.0), getRandom(0.5, 1.0), 1.0])
            mat4.scale(localMx, localMx, [0.5, 0.5, 0.5]);
            mat4.translate(localMx, localMx, [0, 0, -1]);
            const finalModelMx: mat4 = mat4.create();
            console.log('w2Checkerboard', w2Checkerboard);
            console.log('localMx', localMx);
            mat4.multiply(finalModelMx, w2Checkerboard, localMx);
            console.log('result', finalModelMx)
            buildingPoses.push(finalModelMx);
        }
    }    
}

generateBuildingPos(5, gridCnts);

function drawBuildings(): void {
    for (let model of buildingPoses) {
        lightShaderProgram.uniformMatrix4fv('uModel', model);
        lightShaderProgram.uniform3fv('lightColor', new Float32Array([10.0, 10.0, 10.0]));
        drawCube(gl);
    }
}

window.mat4 = mat4;

const looper = new RenderLooper(drawCB).start();

window.addEventListener('resize', function() {
    const { width, height } = resizeCvs2Screen(gl);
    camera.updateRatio(width / height);
}, false);

// Object.assign(window, {
//     gl
// })

setInterval(function() {
    console.log('fps: ', looper.getFps());
}, 1000);
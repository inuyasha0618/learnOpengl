import { vec3, mat4 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import { getContext, fetchObjFile, resizeCvs2Screen, getRadian } from './utils/index';
import { ShaderProgram, Mesh, loadTex, OrbitCamera, Texture, drawCube } from './gl-helpers/index';
import phongVertSrc from './shaders/phongVert';
import phongFragSrc from './shaders/phongFrag';
import pbrFrag from './shaders/pbrFrag';
import lightFrag from './shaders/lightFrag';

const lightPositions: Array<Float32Array> = [
    new Float32Array([-10.0, 10.0, 10.0]),
    new Float32Array([10.0, 10.0, 10.0]),
    new Float32Array([-10.0, -10.0, 10.0]),
    new Float32Array([10.0, -10.0, 10.0]),
]

const lightColors: Array<Float32Array> = [
    new Float32Array([300.0, 300.0, 300.0]),
    new Float32Array([300.0, 300.0, 300.0]),
    new Float32Array([300.0, 300.0, 300.0]),
    new Float32Array([300.0, 300.0, 300.0])
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

// 加载楼房所使用的高光贴图
const buildingTexture: Texture = new Texture(gl, '../images/strip2.jpg', gl.REPEAT, gl.REPEAT);

const lightTexture: Texture = new Texture(gl, '../images/wall.jpg', gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

// 创建楼体mesh
let buildingMesh: Mesh = new Mesh();
fetchObjFile('../models/Tencent_BinHai.obj').then(function({vertPosArray, vertUVArray, vertNormArray, vertIndexArray}) {
    buildingMesh.init(gl, vertPosArray, vertUVArray, vertNormArray, vertIndexArray);
})

// 创建相机
const camera: OrbitCamera = new OrbitCamera(gl, 15, 0, -25, SCR_WIDTH / SCR_HEIGHT);
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
}


const looper = new RenderLooper(drawCB).start();

window.addEventListener('resize', function() {
    const { width, height } = resizeCvs2Screen(gl);
    camera.updateRatio(width / height);
}, false);

Object.assign(window, {
    gl
})

setInterval(function() {
    console.log('fps: ', looper.getFps());
}, 1000);
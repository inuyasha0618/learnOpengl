import { vec3, mat4 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import { getContext, fetchObjFile, resizeCvs2Screen, getRadian } from './utils/index';
import { ShaderProgram, Mesh, loadTex, OrbitCamera } from './gl-helpers/index';
import phongVertSrc from './shaders/phongVert';
import phongFragSrc from './shaders/phongFrag';

const gl: WebGL2RenderingContext = getContext('#cvs');

// 获得屏幕尺寸

// 创建shaderprogram
const phongShaderProgram: ShaderProgram = new ShaderProgram(gl, phongVertSrc, phongFragSrc, 'phongShaderProgram');
phongShaderProgram.use();
phongShaderProgram.uniform1i('tex', 0);
phongShaderProgram.uniform3fv('light_direction', vec3.fromValues(-2, 1, -1));

const { width: SCR_WIDTH, height: SCR_HEIGHT } = resizeCvs2Screen(gl);

// 加载楼房所使用的高光贴图
const buildingTexture: WebGLTexture = gl.createTexture();
loadTex('../images/strip2.jpg', buildingTexture, gl);

// 创建楼体mesh
let buildingMesh: Mesh = new Mesh();
fetchObjFile('../models/Tencent_BinHai.obj').then(function({vertPosArray, vertUVArray, vertNormArray, vertIndexArray}) {
    buildingMesh.init(gl, vertPosArray, vertUVArray, vertNormArray, vertIndexArray);
})

// 创建相机
const camera: OrbitCamera = new OrbitCamera(gl, 15, 0, -25, SCR_WIDTH / SCR_HEIGHT);
gl.enable(gl.DEPTH_TEST);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.CULL_FACE);

const uvSpeed: number = -0.1;
let uvOffset: number = 0;
let opacity = 0.0;
let opacitySpeed = 0.05;
function drawCB(msDt: number): void {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    uvOffset += uvSpeed * msDt * 0.001;

    camera.addYaw(0.5);
    const view: mat4 = camera.getViewMatrix();
    const perspective: mat4 = camera.getPerspectiveMatrix();
    const model: mat4 = mat4.create();
    mat4.translate(model, model, [0, -6.0, 0]);
    mat4.rotateY(model, model, getRadian(-45));
    mat4.scale(model, model, [0.25, 0.25, 0.25]);
    phongShaderProgram.use();
    phongShaderProgram.uniformMatrix4fv('uModel', model);
    phongShaderProgram.uniformMatrix4fv('uView', view);
    phongShaderProgram.uniformMatrix4fv('uPerspective', perspective);
    phongShaderProgram.uniform3fv('viewPos', camera.position);
    phongShaderProgram.uniform1f('yOffset', uvOffset);

    if (opacity >= 1.0) {
        opacitySpeed = -0.05;
    } else if (opacity <= 0.0) {
        opacitySpeed = 0.05;
    }

    opacity += opacitySpeed * msDt * 0.001;

    // phongShaderProgram.uniform1f('opacity', opacity);
    phongShaderProgram.uniform1f('opacity', 0.1);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, buildingTexture);

    gl.cullFace(gl.FRONT);
    buildingMesh.draw();

    gl.cullFace(gl.BACK);
    buildingMesh.draw();
}


const looper = new RenderLooper(drawCB).start();

window.addEventListener('resize', function() {
    const { width, height } = resizeCvs2Screen(gl);
    camera.updateRatio(width / height);
}, false);
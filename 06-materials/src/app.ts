import { mat4, vec3 } from 'gl-matrix';
import { Shader, Camera, OrbitCamera } from './gl-helpers/index';
import { cubeVerts } from './data/index';
import RenderLooper from 'render-looper';
import { lampVertexSrc, lampFragSrc, cubeVertexSrc, cubeFragSrc } from './shaders/index';
import { getRadian } from './utils/index';

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');
const { width, height } = canvas.getBoundingClientRect();

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.viewport(0, 0, width, height);
gl.enable(gl.DEPTH_TEST);

const lampShader = new Shader(gl, lampVertexSrc, lampFragSrc, 'lampShader');
const cubeShader = new Shader(gl, cubeVertexSrc, cubeFragSrc, 'cubeShader');

const vbo = gl.createBuffer();
const lampVao = gl.createVertexArray();
const cubeVao = gl.createVertexArray();

// 将顶点数据上传至显卡
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);

gl.bindVertexArray(lampVao);
const aPos = lampShader.getAttribLocation('aPos');

gl.vertexAttribPointer(
    aPos,
    3,
    gl.FLOAT,
    false,
    6 * Float32Array.BYTES_PER_ELEMENT,
    0
);

gl.enableVertexAttribArray(aPos);

gl.bindVertexArray(null);

gl.bindVertexArray(cubeVao);
gl.vertexAttribPointer(cubeShader.getAttribLocation('aPos'), 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 0);
gl.vertexAttribPointer(cubeShader.getAttribLocation('aNormal'), 3, gl.FLOAT, false, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
gl.enableVertexAttribArray(cubeShader.getAttribLocation('aPos'));
gl.enableVertexAttribArray(cubeShader.getAttribLocation('aNormal'));
gl.bindVertexArray(null);

const perspeciveMx: mat4 = mat4.create();

const cameraPos = vec3.create();
const worldUp = vec3.create();
vec3.set(cameraPos, 0, 0, 3);
vec3.set(worldUp, 0, 1, 0);
const camera: Camera = new Camera(gl, cameraPos);
const orbitCamera: OrbitCamera = new OrbitCamera(gl, 10);
const lampPos = vec3.create();
vec3.add(lampPos, lampPos, [1.2, 0.3, 2.0]);

let deg = 0;
let rotSpeed =80;

new RenderLooper((msdt, totalTime) => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMx: mat4 = orbitCamera.getViewMatrix();
    mat4.perspective(perspeciveMx, getRadian(orbitCamera.fov), width / height, 0.1, 100);
    const lampModelMx: mat4 = mat4.create();
    
    deg += (msdt * 0.001) * rotSpeed;
    mat4.rotate(lampModelMx, lampModelMx, getRadian(deg), [0, 1, 0]);
    mat4.translate(lampModelMx, lampModelMx, lampPos);
    mat4.scale(lampModelMx, lampModelMx, [0.2, 0.2, 0.2]);

    lampShader.use();
    lampShader.uniformMatrix4fv('uModel', lampModelMx);
    lampShader.uniformMatrix4fv('uView', viewMx);
    lampShader.uniformMatrix4fv('uPerspective', perspeciveMx);

    gl.bindVertexArray(lampVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    const cubeModelMx: mat4 = mat4.create();

    const lampWorldPos: vec3 = vec3.create();
    mat4.getTranslation(lampWorldPos, lampModelMx)

    cubeShader.use();
    cubeShader.uniformMatrix4fv('uModel', cubeModelMx);
    cubeShader.uniformMatrix4fv('uView', viewMx);
    cubeShader.uniformMatrix4fv('uPerspective', perspeciveMx);

    cubeShader.uniform3fv('material.ambient', new Float32Array([1.0, 0.5, 0.31]));
    cubeShader.uniform3fv('material.diffuse', new Float32Array([1.0, 0.5, 0.31]));
    cubeShader.uniform3fv('material.specular', new Float32Array([1.0, 0.5, 0.31]));
    cubeShader.uniform1f('material.shininess', 128.0);

    const lightColor: vec3 = vec3.create();
    vec3.set(
        lightColor,
        Math.sin(totalTime * 0.001 * 2.0),
        Math.sin(totalTime * 0.001 * 0.7),
        Math.sin(totalTime * 0.001 * 1.3)
    )
    const light_ambient: vec3 = vec3.create();
    const light_diffuse: vec3 = vec3.create();
    vec3.mul(light_ambient, lightColor, [0.5, 0.5, 0.5]);
    vec3.mul(light_diffuse, lightColor, [0.2, 0.2, 0.2]);

    cubeShader.uniform3fv('light.ambient', light_ambient);
    cubeShader.uniform3fv('light.diffuse', light_diffuse);
    cubeShader.uniform3fv('light.specular', new Float32Array([1.0, 1.0, 1.0]));
    // cubeShader.uniform3fv('light.diffuse', new Float32Array([0.5, 0.5, 0.5]));
    // cubeShader.uniform3fv('light.specular', new Float32Array([1.0, 1.0, 1.0]));
    cubeShader.uniform3fv('light.position', lampWorldPos);

    cubeShader.uniform3fv('uViewPos', orbitCamera.position);

    gl.bindVertexArray(cubeVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

}).start()



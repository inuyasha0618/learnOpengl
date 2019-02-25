import { mat4, vec3 } from 'gl-matrix';
import { Shader, getShaderStrById, cubeVerts, Camera, OrbitCamera } from './utils/index';
import RenderLooper from 'render-looper';

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');
const { width, height } = canvas.getBoundingClientRect();

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.viewport(0, 0, width, height);
gl.enable(gl.DEPTH_TEST);

const lampShader = new Shader(gl, getShaderStrById('#lamp-vertex'), getShaderStrById('#lamp-fragment'));
const cubeShader = new Shader(gl, getShaderStrById('#cube-vertex'), getShaderStrById('#cube-fragment'));

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

new RenderLooper(msdt => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMx: mat4 = orbitCamera.getViewMatrix();
    mat4.perspective(perspeciveMx, orbitCamera.fov / 180 * Math.PI, width / height, 0.1, 100);
    const lampModelMx: mat4 = mat4.create();
    
    deg += (msdt * 0.001) * rotSpeed;
    mat4.rotate(lampModelMx, lampModelMx, deg / 180 * Math.PI, [0, 1, 0]);
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
    cubeShader.uniform3fv('uObjectColor', new Float32Array([1.0, 0.5, 0.31]));
    cubeShader.uniform3fv('uLightColor', new Float32Array([1.0, 1.0, 1.0]));
    cubeShader.uniform3fv('uLightPos', lampWorldPos);
    cubeShader.uniform3fv('uViewPos', orbitCamera.position);
    cubeShader.uniform1f('uShineness', 128.0);

    gl.bindVertexArray(cubeVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

}).start()



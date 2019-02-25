import { mat4, vec3 } from 'gl-matrix';
import { Shader, getShaderStrById, cubeVerts, Camera } from './utils/index';
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
    0,
    0
);

gl.enableVertexAttribArray(aPos);

gl.bindVertexArray(null);

gl.bindVertexArray(cubeVao);
gl.vertexAttribPointer(cubeShader.getAttribLocation('aPos'), 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(cubeShader.getAttribLocation('aPos'));
gl.bindVertexArray(null);

const perspeciveMx: mat4 = mat4.create();

const cameraPos = vec3.create();
const worldUp = vec3.create();
vec3.set(cameraPos, 0, 0, 3);
vec3.set(worldUp, 0, 1, 0);
const camera: Camera = new Camera(gl, cameraPos, worldUp);


new RenderLooper(() => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMx: mat4 = camera.getViewMatrix();
    mat4.perspective(perspeciveMx, camera.fov / 180 * Math.PI, width / height, 0.1, 100);
    const lampModelMx: mat4 = mat4.create();
    mat4.translate(lampModelMx, lampModelMx, [1.2, 1.0, 2.0]);
    mat4.scale(lampModelMx, lampModelMx, [0.2, 0.2, 0.2]);


    lampShader.use();
    lampShader.uniformMatrix4fv('uModel', lampModelMx);
    lampShader.uniformMatrix4fv('uView', viewMx);
    lampShader.uniformMatrix4fv('uPerspective', perspeciveMx);

    gl.bindVertexArray(lampVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    const cubeModelMx: mat4 = mat4.create();

    cubeShader.use();
    cubeShader.uniformMatrix4fv('uModel', cubeModelMx);
    cubeShader.uniformMatrix4fv('uView', viewMx);
    cubeShader.uniformMatrix4fv('uPerspective', perspeciveMx);
    cubeShader.uniform3fv('uColor', new Float32Array([1.0, 0.5, 0.31]));
    cubeShader.uniform3fv('uLightColor', new Float32Array([1.0, 1.0, 1.0]))

    gl.bindVertexArray(cubeVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

}).start()



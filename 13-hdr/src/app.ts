import { mat4 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import {
    OrbitCamera,
    ShaderProgram,
    texLoader
} from './gl-helpers';
import { getRadian } from './utils';

import lightShaderSource from './shaders/light/index';
import hdrShaderSource from './shaders/hdr/index';

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const { width: SCR_WIDTH, height: SCR_HEIGHT } = canvas.getBoundingClientRect();
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');
if (!gl) {
    throw 'This browser does not support webgl 2.0'
}
// look at https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/renderbufferStorage
gl.getExtension('EXT_color_buffer_float');

const lightShaderProgram: ShaderProgram = new ShaderProgram(gl, lightShaderSource.vertexSrc, lightShaderSource.fragSrc, 'lightShaderProgram');
const hdrShaderProgram: ShaderProgram = new ShaderProgram(gl, hdrShaderSource.vertexSrc, hdrShaderSource.fragSrc, 'hdrShaderProgram');

const colorBuffer: WebGLTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.bindTexture(gl.TEXTURE_2D, null);

const depthBuffer: WebGLTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, depthBuffer);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SCR_WIDTH, SCR_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.bindTexture(gl.TEXTURE_2D, null);

const lightFBO: WebGLFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, lightFBO);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthBuffer, 0);

const framebuffer_status: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
if (framebuffer_status === gl.FRAMEBUFFER_COMPLETE) {
    console.log('framebuffer create success!');
} else {
    console.error(`framebuffer invalid ${framebuffer_status.toString()}`);
}
gl.bindFramebuffer(gl.FRAMEBUFFER, null);

const lightPositions: Array<Float32Array> = [
    new Float32Array([0.0,  0.0, 49.5]),
    new Float32Array([-1.4, -1.9, 9.0]),
    new Float32Array([0.0, -1.8, 4.0]),
    new Float32Array([0.8, -1.7, 6.0]),
];

const lightColors: Array<Float32Array> = [
    new Float32Array([200.0, 200.0, 200.0]),
    new Float32Array([0.1, 0.0, 0.0]),
    new Float32Array([0.0, 0.0, 0.2]),
    new Float32Array([0.0, 0.1, 0.0]),
];

// shaderProgram中不变的内容先初始化好
lightShaderProgram.use();
const modelMatrix = mat4.create();
mat4.translate(modelMatrix, modelMatrix, [0.0, 0.0, 25.0]);
mat4.scale(modelMatrix, modelMatrix, [2.5, 2.5, 27.5]);
lightShaderProgram.uniformMatrix4fv('model', modelMatrix);
lightShaderProgram.uniform1i('tex', 0);
for (let i = 0; i < 4; i++) {
    lightShaderProgram.uniform3fv(`lights[${i}].color`, lightColors[i]);
    lightShaderProgram.uniform3fv(`lights[${i}].position`, lightPositions[i]);
}

hdrShaderProgram.use();
hdrShaderProgram.uniform1i('tex', 0);
hdrShaderProgram.uniform1f('exposure', 10.0);

const camera: OrbitCamera = new OrbitCamera(gl, 1, 180);

gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.enable(gl.DEPTH_TEST);

const woodTexture: WebGLTexture = gl.createTexture();
texLoader('../images/container.jpg').then(img => {
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, (<HTMLImageElement>img).width, (<HTMLImageElement>img).height, 0, gl.RGB, gl.UNSIGNED_BYTE, (<HTMLImageElement>img) )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
})

// 开始绘制循环
new RenderLooper(() => {
    const viewMatrix: mat4 = camera.getViewMatrix();
    const perspective: mat4 = mat4.create();
    mat4.perspective(perspective, getRadian(camera.fov), SCR_WIDTH / SCR_HEIGHT, 0.1, 100);

    lightShaderProgram.use();
    lightShaderProgram.uniformMatrix4fv('perspective', perspective);
    lightShaderProgram.uniformMatrix4fv('view', viewMatrix);

    gl.bindFramebuffer(gl.FRAMEBUFFER, lightFBO);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);
    drawCube();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    hdrShaderProgram.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    drawQuad();
}).start();

let quadVAO: WebGLVertexArrayObject;
function drawQuad(): void {
    if (!quadVAO) {
        quadVAO = gl.createVertexArray();
        gl.bindVertexArray(quadVAO);
        const quadData: Float32Array = new Float32Array([
            -1.0,  1.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0, 0.0,
             1.0,  1.0, 0.0, 1.0, 1.0,
             1.0, -1.0, 0.0, 1.0, 0.0,
        ]);
        const quadBuffer: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT)
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
}

let cubeVAO: WebGLVertexArrayObject;
function drawCube(): void {
    if (!cubeVAO) {
        cubeVAO = gl.createVertexArray();
        const vertexData: Float32Array = new Float32Array([
            // back face
            -1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
             1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
             1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 0.0, // bottom-right         
             1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0,  1.0, -1.0,  0.0,  0.0, -1.0, 0.0, 1.0, // top-left
            // front face
            -1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
             1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 0.0, // bottom-right
             1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
             1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 1.0, 1.0, // top-right
            -1.0,  1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 1.0, // top-left
            -1.0, -1.0,  1.0,  0.0,  0.0,  1.0, 0.0, 0.0, // bottom-left
            // left face
            -1.0,  1.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
            -1.0,  1.0, -1.0, -1.0,  0.0,  0.0, 1.0, 1.0, // top-left
            -1.0, -1.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, -1.0, -1.0,  0.0,  0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0,  1.0, -1.0,  0.0,  0.0, 0.0, 0.0, // bottom-right
            -1.0,  1.0,  1.0, -1.0,  0.0,  0.0, 1.0, 0.0, // top-right
            // right face
             1.0,  1.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
             1.0, -1.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
             1.0,  1.0, -1.0,  1.0,  0.0,  0.0, 1.0, 1.0, // top-right         
             1.0, -1.0, -1.0,  1.0,  0.0,  0.0, 0.0, 1.0, // bottom-right
             1.0,  1.0,  1.0,  1.0,  0.0,  0.0, 1.0, 0.0, // top-left
             1.0, -1.0,  1.0,  1.0,  0.0,  0.0, 0.0, 0.0, // bottom-left     
            // bottom face
            -1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
             1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 1.0, 1.0, // top-left
             1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
             1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 1.0, 0.0, // bottom-left
            -1.0, -1.0,  1.0,  0.0, -1.0,  0.0, 0.0, 0.0, // bottom-right
            -1.0, -1.0, -1.0,  0.0, -1.0,  0.0, 0.0, 1.0, // top-right
            // top face
            -1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
             1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
             1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 1.0, 1.0, // top-right     
             1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 1.0, 0.0, // bottom-right
            -1.0,  1.0, -1.0,  0.0,  1.0,  0.0, 0.0, 1.0, // top-left
            -1.0,  1.0,  1.0,  0.0,  1.0,  0.0, 0.0, 0.0  // bottom-left   
        ]);
        gl.bindVertexArray(cubeVAO);
        const cubeVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.bindVertexArray(null);
}

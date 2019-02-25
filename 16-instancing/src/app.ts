import { mat4 } from 'gl-matrix';
import RenderLooper from 'render-looper';
import { ShaderProgram, OrbitCamera, loadTex } from './gl-helpers'
import { getRadian, loadObjFile } from './utils';
import bloom_vertex from './shaders/bloom_vertex';
import instanced_array from './shaders/instanced_array';
import bloom_frag from './shaders/bloom_frag';
import bloom_lightbox_frag from './shaders/bloom_lightbox_frag';
import quad_vertex from './shaders/quad_vertex';
import blur_frag from './shaders/blur_frag';
import final_frag from './shaders/final_frag';
import debug_stright_quad from './shaders/debug_stright_quad';

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const { width: SCR_WIDTH, height: SCR_HEIGHT } = canvas.getBoundingClientRect();
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');

if (!gl) throw 'This browser does not support webgl 2.0';

gl.getExtension('EXT_color_buffer_float');

const colorBuffer: WebGLTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
gl.bindTexture(gl.TEXTURE_2D, null);

const highlight_colorBuffer: WebGLTexture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, highlight_colorBuffer);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
gl.bindTexture(gl.TEXTURE_2D, null);

const depthBuffer: WebGLBuffer = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, depthBuffer);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SCR_WIDTH, SCR_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
gl.bindTexture(gl.TEXTURE_2D, null);

const hdrFBO: WebGLFramebuffer = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, highlight_colorBuffer, 0);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthBuffer, 0);
gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

const status: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
if (status === gl.FRAMEBUFFER_COMPLETE) {
    console.log('framebuffer create success!');
} else {
    console.error(`frame buffer invalid, status: ${status}`);
}

gl.bindFramebuffer(gl.FRAMEBUFFER, null);

// 处理乒乓镇缓存区配置

const pingpong_FBO: Array<WebGLFramebuffer> = [
    gl.createFramebuffer(),
    gl.createFramebuffer()
];

const pingpong_color_buffer: Array<WebGLTexture> = [
    gl.createTexture(),
    gl.createTexture()
]

const pingpong_depth_buffer: Array<WebGLTexture> = [
    gl.createTexture(),
    gl.createTexture()
]

for (let i: number = 0, size: number = pingpong_FBO.length; i < size; i++) {
    gl.bindTexture(gl.TEXTURE_2D, pingpong_color_buffer[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
    
    gl.bindTexture(gl.TEXTURE_2D, pingpong_depth_buffer[i]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SCR_WIDTH, SCR_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, pingpong_FBO[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pingpong_color_buffer[i], 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, pingpong_depth_buffer[i], 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
gl.enable(gl.DEPTH_TEST);

const woodTexture: WebGLTexture = gl.createTexture();
const containerTexture: WebGLTexture = gl.createTexture();
loadTex('../images/wall.jpg', woodTexture, gl);
loadTex('../images/container.png', containerTexture, gl);

interface BoxInfo {
    position: Array<number>,
    rotate?: number,
    rotateAxis?: Array<number>,
    scale?: Array<number>,
    texture: WebGLTexture
}

interface LightInfo {
    color: Float32Array,
    position: Array<number>
}

const boxInfos: Array<BoxInfo> = [
    {
        position: [0.0, -1.0, 0.0],
        scale: [12.5, 0.5, 12.5],
        texture: woodTexture
    },
    {
        position: [0.0, 1.5, 0.0],
        scale: [0.5, 0.5, 0.5],
        texture: containerTexture
    },
    {
        position: [2.0, 0.0, 1.0],
        scale: [0.5, 0.5, 0.5],
        texture: containerTexture

    },
    {
        position: [-1.0, -1.0, 2.0],
        rotate: 60,
        rotateAxis: [1.0, 0.0, 1.0],
        texture: containerTexture
    },
    {
        position: [0.0, 2.7, 4.0],
        rotate: 23,
        rotateAxis: [1.0, 0.0, 1.0],
        scale: [1.25, 1.25, 1.25],
        texture: containerTexture
    },
    {
        position: [-2.0, 1.0, -3.0],
        rotate: 124,
        rotateAxis: [1.0, 0.0, 1.0],
        texture: containerTexture
    },
    {
        position: [-3.0, 0.0, 0.0],
        scale: [0.5, 0.5, 0.5],
        texture: containerTexture
    }
];

const lightInfos: Array<LightInfo> = [
    {
        position: [0.0, 0.5,  1.5],
        color: new Float32Array([5.0,   5.0,  5.0])
    },
    {
        position: [-4.0, 0.5, -3.0],
        color: new Float32Array([10.0, 0.0, 0.0])
    },
    {
        position: [3.0, 0.5,  1.0],
        color: new Float32Array([0.0, 0.0, 15.0])
    },
    {
        position: [-0.8, 2.4, -1.0],
        color: new Float32Array([0.0, 5.0, 0.0])
    }
];

const cubeShaderProgram: ShaderProgram = new ShaderProgram(gl, bloom_vertex, bloom_frag, 'cubeShaderProgram');
cubeShaderProgram.use();
cubeShaderProgram.uniform1i('tex', 0);
for (let i = 0, size = lightInfos.length; i < size; i++) {
    cubeShaderProgram.uniform3fv(`lights[${i}].color`, lightInfos[i].color);
    cubeShaderProgram.uniform3fv(`lights[${i}].position`, new Float32Array(lightInfos[i].position));
}

const cubeInstaceShaderProgram: ShaderProgram = new ShaderProgram(gl, instanced_array, bloom_frag, 'cubeInstaceShaderProgram');
cubeInstaceShaderProgram.use();
cubeInstaceShaderProgram.uniform1i('tex', 0);
for (let i = 0, size = lightInfos.length; i < size; i++) {
    cubeInstaceShaderProgram.uniform3fv(`lights[${i}].color`, lightInfos[i].color);
    cubeInstaceShaderProgram.uniform3fv(`lights[${i}].position`, new Float32Array(lightInfos[i].position));
}

const lightBoxShaderProgram: ShaderProgram = new ShaderProgram(gl, bloom_vertex, bloom_lightbox_frag, 'lightBoxShaderProgram');

const blurShaderProgram: ShaderProgram = new ShaderProgram(gl, quad_vertex, blur_frag, 'blurShaderProgram');
blurShaderProgram.use();
blurShaderProgram.uniform1i('tex', 0);
const weight: Array<number> = [0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162];
for (let i = 0; i < 5; i++) {
    blurShaderProgram.uniform1f(`weight[${i}]`, weight[i]);
}

const mainShaderProgram: ShaderProgram = new ShaderProgram(gl, quad_vertex, final_frag, 'mainShaderProgram');
mainShaderProgram.use();
mainShaderProgram.uniform1i('hdr_tex', 0);
mainShaderProgram.uniform1i('blur_tex', 1);
mainShaderProgram.uniform1f('exposure', 1.0);

const debugQuadShaderProgram: ShaderProgram = new ShaderProgram(gl, quad_vertex, debug_stright_quad, 'debugQuadShaderProgram');
debugQuadShaderProgram.use();
debugQuadShaderProgram.uniform1i('tex', 0);

const camera: OrbitCamera = new OrbitCamera(gl, 10.0, 60, -30);
const looper = new RenderLooper(() => {
    const view: mat4 = camera.getViewMatrix();
    const perspective: mat4 = mat4.create();
    mat4.perspective(perspective, getRadian(camera.fov), SCR_WIDTH / SCR_HEIGHT, 0.1, 100);

    // 绘制盒子
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    cubeInstaceShaderProgram.use();
    cubeInstaceShaderProgram.uniformMatrix4fv('perspective', perspective);
    cubeInstaceShaderProgram.uniformMatrix4fv('view', view);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);
    drawCube();

    // 绘制龙🐉
    cubeShaderProgram.use();
    cubeShaderProgram.uniformMatrix4fv('perspective', perspective);
    cubeShaderProgram.uniformMatrix4fv('view', view);
    const model: mat4 = mat4.create();
    mat4.scale(model, model, [0.7, 0.7, 0.7]);
    cubeShaderProgram.uniformMatrix4fv('model', model);
    drawDragon(model, view, perspective);

    // 绘制灯
    lightBoxShaderProgram.use();
    lightBoxShaderProgram.uniformMatrix4fv('perspective', perspective);
    lightBoxShaderProgram.uniformMatrix4fv('view', view);

    for (let i = 0, size = lightInfos.length; i < size; i++) {
        const { position, color } = lightInfos[i];
        const model: mat4 = mat4.create();
        mat4.translate(model, model, position);
        mat4.scale(model, model, [0.5, 0.5, 0.5]);
        lightBoxShaderProgram.uniformMatrix4fv('model', model);
        lightBoxShaderProgram.uniform3fv('lightColor', color);
        drawLight();
        // lightBoxShaderProgram.uniform3fv('lightColor', new Float32Array([0.9, 0.9, 0.9]));
        // drawNormal();
    }

    // // 测试代码
    // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // debugQuadShaderProgram.use();
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, highlight_colorBuffer);
    // drawQuad();

    let horizontal: boolean = true;
    // 高斯模糊
    blurShaderProgram.use();
    for (let i = 0; i < 10; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingpong_FBO[Number(!horizontal)]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, i === 0 ? highlight_colorBuffer : pingpong_color_buffer[Number(horizontal)]);
        blurShaderProgram.uniform1i('horizontal', Number(horizontal));
        drawQuad();
        horizontal = !horizontal;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    // 最终，合并输出
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mainShaderProgram.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pingpong_color_buffer[1]);
    drawQuad();
}).start();

// setInterval(() => {
//     console.log(looper.getFps());
// }, 2000);

let cubeVAO: WebGLVertexArrayObject;
function drawCube(): void {
    if (!cubeVAO) {
        cubeVAO = gl.createVertexArray();
        gl.bindVertexArray(cubeVAO);
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
        const vertexVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // 使用实例化数组
        const tempArr: Array<number> = boxInfos.reduce((acc: Array<number>, current: BoxInfo) => {
            const currentModel: mat4 = mat4.create();
            mat4.translate(currentModel, currentModel, current.position);
            if (current.rotate) {
                mat4.rotate(currentModel, currentModel, getRadian(current.rotate), current.rotateAxis);
            }
            if (current.scale) {
                mat4.scale(currentModel, currentModel, current.scale);
            }
            for (let i = 0, size = currentModel.length; i < size; i++) {
                acc.push(currentModel[i]);
            }
            return acc;
        }, []);


        const modelVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, modelVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tempArr), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 0);

        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 4 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 8 * Float32Array.BYTES_PER_ELEMENT);

        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 16 * Float32Array.BYTES_PER_ELEMENT, 12 * Float32Array.BYTES_PER_ELEMENT);
        
        gl.vertexAttribDivisor(3, 1);
        gl.vertexAttribDivisor(4, 1);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);
        gl.bindVertexArray(null);

    }
    gl.bindVertexArray(cubeVAO);
    // gl.drawArrays(gl.TRIANGLES, 0, 36)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, boxInfos.length);
    gl.bindVertexArray(null);
}

let lightVAO: WebGLVertexArrayObject;
let lightVertexData: Float32Array = new Float32Array([]);
let normalVAO: WebGLVertexArrayObject;
let normalData: Float32Array = new Float32Array([]);

// loadObjFile('../models/TheStanfordDragon.obj').then(({ vertex_pos_data, normalLineData }) => {
loadObjFile('../models/cube.obj').then(({ vertex_pos_data, normalLineData }) => {
    lightVertexData = vertex_pos_data;     
    normalData = normalLineData;
});

function drawLight(): void {
    if (!lightVertexData.length) return;
    if (!lightVAO) {
        lightVAO = gl.createVertexArray();
        gl.bindVertexArray(lightVAO);
        
        const vertexVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexVBO);
        gl.bufferData(gl.ARRAY_BUFFER, lightVertexData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(lightVAO);
    gl.drawArrays(gl.TRIANGLES, 0, lightVertexData.length / 3);
    gl.bindVertexArray(null);
}

function drawNormal(): void {
    if (!normalData.length) return;
    if (!normalVAO) {
        normalVAO = gl.createVertexArray();
        gl.bindVertexArray(normalVAO);
        
        const vertexVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexVBO);
        gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(normalVAO);
    gl.drawArrays(gl.LINES, 0, normalData.length / 3);
    gl.bindVertexArray(null);
}

const planetTexture: WebGLTexture = gl.createTexture();
loadTex('../models/planet_Quom1200.png', planetTexture, gl);

loadObjFile('../models/TheStanfordDragon.obj').then(({ vertex_pos_data, output_smooth_normals, normalLineData, vertex_uv_data }) => {
// loadObjFile('../models/suzanne.obj').then(({ vertex_pos_data, output_smooth_normals, normalLineData }) => {
// loadObjFile('../models/cube.obj').then(({ vertex_pos_data, output_smooth_normals, normalLineData }) => {
// loadObjFile('../models/planet.obj').then(({ vertex_pos_data, output_smooth_normals, normalLineData, vertex_uv_data }) => {
        dragonData = vertex_pos_data;     
        dragonNormalData = output_smooth_normals;
        dragonNormalLineData = normalLineData;
        dragonUVData = vertex_uv_data;
    });

let dragonData: Float32Array = new Float32Array([]);
let dragonNormalData: Float32Array = new Float32Array([]);
let dragonUVData: Float32Array = new Float32Array([]);
let dragonNormalLineData: Float32Array = new Float32Array([]);
let dragonVAO: WebGLVertexArrayObject;
let dragonNormalVAO: WebGLVertexArrayObject;
function drawDragon(model: mat4, view: mat4, perspective: mat4): void {
    if (!dragonData.length) return;
    
    if (!dragonVAO) {
        dragonVAO = gl.createVertexArray();
        gl.bindVertexArray(dragonVAO);
        
        const dragon_vertex_vbo: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dragon_vertex_vbo);
        gl.bufferData(gl.ARRAY_BUFFER, dragonData, gl.STATIC_DRAW);
        
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        const dragon_normal_vbo: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dragon_normal_vbo);
        gl.bufferData(gl.ARRAY_BUFFER, dragonNormalData, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        const dragon_uv_vbo: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, dragon_uv_vbo);
        gl.bufferData(gl.ARRAY_BUFFER, dragonUVData, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

    }
    // if (!dragonNormalVAO) {
    //     dragonNormalVAO = gl.createVertexArray();
    //     gl.bindVertexArray(dragonNormalVAO);

    //     const dragonNormalLineVBO: WebGLBuffer = gl.createBuffer();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, dragonNormalLineVBO);
    //     gl.bufferData(gl.ARRAY_BUFFER, dragonNormalLineData, gl.STATIC_DRAW);

    //     gl.enableVertexAttribArray(0);
    //     gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, null);
    //     gl.bindVertexArray(null);
    // }
    gl.bindVertexArray(dragonVAO);
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, planetTexture);
    gl.drawArrays(gl.TRIANGLES, 0, dragonData.length / 3);
    // lightBoxShaderProgram.use();
    // lightBoxShaderProgram.uniformMatrix4fv('model', model);
    // lightBoxShaderProgram.uniformMatrix4fv('perspective', perspective);
    // lightBoxShaderProgram.uniformMatrix4fv('view', view);
    // lightBoxShaderProgram.uniform3fv('lightColor', new Float32Array([0.9, 0.9, 0.9]));
    // gl.bindVertexArray(dragonNormalVAO);
    // gl.drawArrays(gl.LINES, 0, dragonNormalLineData.length / 3);
    gl.bindVertexArray(null);
}

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
        const quadVBO: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0 , 4);
    gl.bindVertexArray(null);
}
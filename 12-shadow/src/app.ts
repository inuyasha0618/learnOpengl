import { mat4, vec3 } from 'gl-matrix';
import { Shader, OrbitCamera, texLoader, Mesh, Model, createFrameBuffer } from './gl-helpers/index';
import { cubeVerts, quadVerts } from './data/index';
import RenderLooper from 'render-looper';
import {
    lampVertexSrc,
    lampFragSrc,
    cubeVertexSrc,
    cubeFragSrc,
    borderCubeVertexSrc,
    borderCubeFragSrc,
    depthShaderVertexSrc,
    depthShaderFragSrc,
    debugVertSrc,
    debugFragSrc
} from './shaders/index';
import { getRadian } from './utils/index';
import { TexType } from './enums/index';

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2', {
    stencil: true
});
const { width, height } = canvas.getBoundingClientRect();

const cubePositions: Array<Array<number>> = [
    [2.0,  5.0, -15.0],
    [-1.7,  3.0, -7.5],
    [1.5,  2.0, -2.5],
    [-1.3,  1.0, -1.5]
];

const pointLightPositions: Array<Array<number>> = [
    [-0.0, 5.0, 0.0],
];


gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.viewport(0, 0, width, height);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.STENCIL_TEST);
gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

const lampShader = new Shader(gl, lampVertexSrc, lampFragSrc, 'lampShader');
const cubeShader = new Shader(gl, cubeVertexSrc, cubeFragSrc, 'cubeShader');
const borderCubeShader = new Shader(gl, borderCubeVertexSrc, borderCubeFragSrc);
const depthShader = new Shader(gl, depthShaderVertexSrc, depthShaderFragSrc);

const debugShader = new Shader(gl, debugVertSrc, debugFragSrc, 'debug_shader');

depthShader.use();
const depthView: mat4 = mat4.create();
mat4.lookAt(depthView, [0.0, 50.0, 0.0], [0.0, 0.0, 0.0], [1.0, 0.0, 0.0]);
const depthPerspective: mat4 = mat4.create();
mat4.perspective(depthPerspective, getRadian(60.0), 1, 0.1, 1000);
depthShader.uniformMatrix4fv('uView', depthView);
depthShader.uniformMatrix4fv('uPerspective', depthPerspective);
depthShader.uniform3fv('light_pos_world', new Float32Array([0.0, 50.0, 0.0]));
depthShader.uniform1f('far_plane', 1000.0);
const lightVp: mat4 = mat4.create();
mat4.mul(lightVp, depthPerspective, depthView);
cubeShader.use();
cubeShader.uniformMatrix4fv('shadowVp', lightVp);
cubeShader.uniformMatrix4fv('shadowV', depthView);
cubeShader.uniformMatrix4fv('shadowP', depthPerspective);
cubeShader.uniform1i('SHADOW_TEXTURE', 3);
cubeShader.uniform1f('far_plane', 1000.0);

const depthTexture: WebGLTexture = gl.createTexture();
const colorTexture: WebGLTexture = gl.createTexture();

const depthFrameBuffer: WebGLFramebuffer = createFrameBuffer(gl, 2048, 2048, colorTexture, depthTexture);

debugShader.use();
debugShader.uniform1i('depthMap', 0);
debugShader.uniform1f('near_plane', 0.1);
debugShader.uniform1f('far_plane', 1000.0);

// 设置材质
Promise.all([
        texLoader('../images/container.png'),
        texLoader('../images/container_specular.png'),
        texLoader('../images/wood.jpg')
    ])
    .then(([img1, img2, wood]) => {
        const diffuseTexture = gl.createTexture();
        const specularTexture = gl.createTexture();
        const woodTexture = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, (<HTMLImageElement>img1).width, (<HTMLImageElement>img1).height, 0, gl.RGBA, gl.UNSIGNED_BYTE, <HTMLImageElement>img1)
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, specularTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, (<HTMLImageElement>img2).width, (<HTMLImageElement>img2).height, 0, gl.RGBA, gl.UNSIGNED_BYTE, <HTMLImageElement>img2)
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, woodTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, (<HTMLImageElement>wood).width, (<HTMLImageElement>wood).height, 0, gl.RGB, gl.UNSIGNED_BYTE, <HTMLImageElement>wood)
        gl.generateMipmap(gl.TEXTURE_2D);

        const lampMesh: Mesh = new Mesh(gl, cubeVerts, []);
        const cubeMesh: Mesh = new Mesh(gl, cubeVerts, [
            {
                type: TexType.DIFFUSE,
                tex: diffuseTexture
            },
            {
                type: TexType.SPECULAR,
                tex: specularTexture
            },
        ]);
        const quadMesh: Mesh = new Mesh(gl, quadVerts, [
            {
                type: TexType.DIFFUSE,
                tex: woodTexture
            }
        ]);

        const quadModelMx = mat4.create();
        const quadModel: Model = new Model(gl, quadMesh, quadModelMx, false);
        cubeModels.push(quadModel);

        // 创建好几个Model
        for (let i = 0; i < pointLightPositions.length; i++) {
            const lampModelMx: mat4 = mat4.create();
            mat4.translate(lampModelMx, lampModelMx, pointLightPositions[i]);
            mat4.scale(lampModelMx, lampModelMx, [0.2, 0.2, 0.2]);
            const lampModel = new Model(gl, lampMesh, lampModelMx);
            lampModels.push(lampModel);
        }

        for (let i = 0; i < cubePositions.length; i++) {
            const cubeModelMx = mat4.create();
            mat4.translate(cubeModelMx, cubeModelMx, cubePositions[i]);
            mat4.rotate(cubeModelMx, cubeModelMx, getRadian(10 * i), [1.0, 0.3, 0.5]);
            const cubeModel = new Model(gl, cubeMesh, cubeModelMx, false);
            cubeModels.push(cubeModel);
        }
    });

const perspeciveMx: mat4 = mat4.create();
const cameraPos = vec3.create();
const worldUp = vec3.create();
vec3.set(cameraPos, 0, 0, 3);
vec3.set(worldUp, 0, 1, 0);
const orbitCamera: OrbitCamera = new OrbitCamera(gl, 10);
const lampPos = vec3.create();
vec3.add(lampPos, lampPos, [1.2, 1.3, 2.0]);

const lampModels: Array<Model> = [];
const cubeModels: Array<Model> = [];

// TODO: 没办法将所有的uniform配置都放到Mesh中，因为shader是特制的，而Mesh是通用的

cubeShader.use();
cubeShader.uniform1f('material.shininess', 32.0);

// 配置方向光
cubeShader.uniform3fv('dirLight.ambient', new Float32Array([0.2, 0.2, 0.2]));
cubeShader.uniform3fv('dirLight.diffuse', new Float32Array([0.8, 0.8, 0.8]));
cubeShader.uniform3fv('dirLight.specular', new Float32Array([1.0, 1.0, 1.0]));
cubeShader.uniform3fv('dirLight.direction', new Float32Array([-0.2, -1.0, -0.3]));

// 配置聚光灯
cubeShader.uniform3fv('spotLight.ambient', new Float32Array([0.2, 0.2, 0.2]));
cubeShader.uniform3fv('spotLight.diffuse', new Float32Array([0.8, 0.8, 0.8]));
cubeShader.uniform3fv('spotLight.specular', new Float32Array([1.0, 1.0, 1.0]));
cubeShader.uniform1f('spotLight.constant', 1.0);
cubeShader.uniform1f('spotLight.linear', 0.09);
cubeShader.uniform1f('spotLight.quadratic', 0.032);
cubeShader.uniform1f('spotLight.cutOff', Math.cos(getRadian(15)));
cubeShader.uniform1f('spotLight.outCutOff', Math.cos(getRadian(20)));

// 配置点光源
for (let i = 0; i < pointLightPositions.length; i++) {
    cubeShader.uniform3fv(`pointLights[${i}].ambient`, new Float32Array([0.2, 0.2, 0.2]));
    cubeShader.uniform3fv(`pointLights[${i}].diffuse`, new Float32Array([0.8, 0.8, 0.8]));
    cubeShader.uniform3fv(`pointLights[${i}].specular`, new Float32Array([1.0, 1.0, 1.0]));
    cubeShader.uniform3fv(`pointLights[${i}].position`, new Float32Array(pointLightPositions[i]));
    cubeShader.uniform1f(`pointLights[${i}].constant`, 1.0);
    cubeShader.uniform1f(`pointLights[${i}].linear`, 0.09);
    cubeShader.uniform1f(`pointLights[${i}].quadratic`, 0.032);
}

let quadVAO: WebGLVertexArrayObject;
let quadVBO: WebGLBuffer;
function renderQuad()
{
    if (!quadVAO)
    {
        const quadVertices: Float32Array = new Float32Array([
            // positions        // texture Coords
            -1.0,  1.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0, 0.0,
             1.0,  1.0, 0.0, 1.0, 1.0,
             1.0, -1.0, 0.0, 1.0, 0.0,
    ]);
        // setup plane VAO
        quadVAO = gl.createVertexArray();
        quadVBO = gl.createBuffer();
        gl.bindVertexArray(quadVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT,);
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
}

new RenderLooper(msdt => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.viewport(0, 0, 2048, 2048);
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFrameBuffer);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    depthShader.use();
    for (let cubeModel of cubeModels) {
        cubeModel.draw(depthShader);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    const viewMx: mat4 = orbitCamera.getViewMatrix();
    mat4.perspective(perspeciveMx, getRadian(orbitCamera.fov), width / height, 0.1, 100);

    lampShader.use();
    lampShader.uniformMatrix4fv('uView', viewMx);
    lampShader.uniformMatrix4fv('uPerspective', perspeciveMx);

    for (let lampModel of lampModels) {
        lampModel.draw(lampShader);
    }

    cubeShader.use();
    cubeShader.uniformMatrix4fv('uView', viewMx);
    cubeShader.uniformMatrix4fv('uPerspective', perspeciveMx);
    cubeShader.uniform3fv('spotLight.position', orbitCamera.position);
    cubeShader.uniform3fv('spotLight.direction', orbitCamera.front);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);

    cubeShader.uniform3fv('uViewPos', orbitCamera.position);

    for (let cubeModel of cubeModels) {
        cubeModel.draw(cubeShader, borderCubeShader);
    }

    // debugShader.use();
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    // renderQuad();
    
}).start()

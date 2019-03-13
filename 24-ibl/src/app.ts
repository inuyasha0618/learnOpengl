import { mat4, vec3 } from 'gl-matrix'
import RenderLooper from 'render-looper';
import { ShaderProgram, drawCube, drawCubeSmooth, OrbitCamera, drawQuad, drawQuadWithTex, renderSphere } from './gl-helpers/index';
import { getContext, resizeCvs2Screen, getRadian } from './utils/index';
import background_vs from './shaders/background_vs';
import background_fs from './shaders/background_fs';
import brdf_vs from './shaders/brdf_vs';
import brdf_fs from './shaders/brdf_fs';
import cubemap_vs from './shaders/cubemap_vs';
import equirectangular_to_cubemap_fs from './shaders/equirectangular_to_cubemap_fs';
import irradiance_convolution_fs from './shaders/irradiance_convolution_fs';
import pbr_vs from './shaders/pbr_vs';
import pbr_fs from './shaders/pbr_fs';
import prefilter_fs from './shaders/prefilter_fs';

const lightPositions: Array<Float32Array> = [
    new Float32Array([-10.0, 10.0, 10.0]),
    new Float32Array([10.0, 10.0, 10.0]),
    new Float32Array([-10.0, -10.0, 10.0]),
    new Float32Array([10.0, -10.0, 10.0]),
];

const lightColors: Array<Float32Array> = [
    new Float32Array([300.0, 300.0, 300.0]),
    new Float32Array([300.0, 300.0, 300.0]),
    new Float32Array([300.0, 300.0, 300.0]),
    new Float32Array([300.0, 300.0, 300.0]),
];

const gl: WebGL2RenderingContext = getContext('#cvs');
gl.getExtension('EXT_color_buffer_float');
const { width: SCR_WIDTH, height: SCR_HEIGHT } = resizeCvs2Screen(gl);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL)
gl.clearColor(0.1, 0.1, 0.1, 1.0);

const pbrShader: ShaderProgram = new ShaderProgram(gl, pbr_vs, pbr_fs, 'pbrShader');
const equirectangularToCubemapShader: ShaderProgram = new ShaderProgram(gl, cubemap_vs, equirectangular_to_cubemap_fs, 'equirectangularToCubemapShader');
const irradianceShader: ShaderProgram = new ShaderProgram(gl, cubemap_vs, irradiance_convolution_fs, 'irradianceShader');
const prefilterShader: ShaderProgram = new ShaderProgram(gl, cubemap_vs, prefilter_fs, 'prefilterShader');
const brdfShader: ShaderProgram = new ShaderProgram(gl, brdf_vs, brdf_fs, 'brdfShader');
const backgroundShader: ShaderProgram = new ShaderProgram(gl, background_vs, background_fs, 'backgroundShader');

pbrShader.use();
pbrShader.uniform1i('irradianceMap', 0);
pbrShader.uniform1i('prefilterMap', 1);
pbrShader.uniform1i('brdfLUT', 2);
pbrShader.uniform3fv('albedo', new Float32Array([0.5, 0.0, 0.0]));
pbrShader.uniform1f('ao', 1.0);

for (let i = 0, size = lightPositions.length; i < size; i++) {
    pbrShader.uniform3fv(`lightPositions[${i}]`, lightPositions[i]);
    pbrShader.uniform3fv(`lightColors[${i}]`, lightColors[i]);
}

backgroundShader.use();
backgroundShader.uniform1i('environmentMap', 0);

const captureFBO: WebGLFramebuffer = gl.createFramebuffer();
const captureRBO: WebGLRenderbuffer = gl.createRenderbuffer();

gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

const myHDR = new HDRImage();
// myHDR.src = './hdr/RedBlueStudio.hdr';
myHDR.src = './hdr/Mans_Outside_2k.hdr';
// myHDR.src = './hdr/Milkyway_small.hdr';
// myHDR.src = './hdr/Milkyway_small.hdr';

myHDR.onload = function() {
    const hdrTexture: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, myHDR.width, myHDR.height, 0, gl.RGB, gl.FLOAT, myHDR.dataFloat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // console.log(`gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT}`)
    // console.log(`gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: ${gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS}`)
    // console.log(`gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT}`)
    // console.log(`gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: ${gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE}`)

    const envCubemap: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 512, 512, 0, gl.RGBA, gl.FLOAT, null);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const captureProjection: mat4 = mat4.create();
    mat4.perspective(captureProjection, getRadian(90), 1.0, 0.1, 10.0);

    const pos_x: mat4 = mat4.create();
    mat4.lookAt(pos_x, [0, 0, 0], [1, 0, 0], [0, -1, 0]);
    const neg_x: mat4 = mat4.create();
    mat4.lookAt(neg_x, [0, 0, 0], [-1, 0, 0], [0, -1, 0]);
    const pos_y: mat4 = mat4.create();
    mat4.lookAt(pos_y, [0, 0, 0], [0, 1, 0], [0, 0, 1]);
    const neg_y: mat4 = mat4.create();
    mat4.lookAt(neg_y, [0, 0, 0], [0, -1, 0], [0, 0, -1]);
    const pos_z: mat4 = mat4.create();
    mat4.lookAt(pos_z, [0, 0, 0], [0, 0, 1], [0, -1, 0]);
    const neg_z: mat4 = mat4.create();
    mat4.lookAt(neg_z, [0, 0, 0], [0, 0, -1], [0, -1, 0]);
    const captureViews: Array<mat4> = [
        pos_x,
        neg_x,
        pos_y,
        neg_y,
        pos_z,
        neg_z
    ];

    equirectangularToCubemapShader.use();
    equirectangularToCubemapShader.uniform1i('equirectangularMap', 0);
    equirectangularToCubemapShader.uniformMatrix4fv('projection', captureProjection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture);

    gl.viewport(0, 0, 512, 512);
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    for (let i = 0; i < 6; i++) {
        equirectangularToCubemapShader.uniformMatrix4fv('view', captureViews[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawCube(gl);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    const irradianceMap: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 32, 32, 0, gl.RGBA, gl.FLOAT, null);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 32, 32);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

    irradianceShader.use();
    irradianceShader.uniform1i('environmentMap', 0);
    irradianceShader.uniformMatrix4fv('projection', captureProjection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

    gl.viewport(0, 0, 32, 32);
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    for (let i = 0; i < 6; i++) {
        irradianceShader.uniformMatrix4fv('view', captureViews[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, irradianceMap, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawCube(gl);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const prefilterMap: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilterMap);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 128, 128, 0, gl.RGBA, gl.FLOAT, null);
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    prefilterShader.use();
    prefilterShader.uniform1i('environmentMap', 0);
    prefilterShader.uniformMatrix4fv('projection', captureProjection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    const maxMipLevels: number = 5;
    for (let mip: number = 0; mip < maxMipLevels; mip++) {
        const mipWidth: number = 128 * Math.pow(0.5, mip);
        const mipHeight: number = 128 * Math.pow(0.5, mip);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mipWidth, mipHeight);
        gl.viewport(0, 0, mipWidth, mipHeight);

        const roughness: number = mip / (maxMipLevels - 1);
        prefilterShader.uniform1f('roughness', roughness);
        for (let i = 0; i < 6; i++) {
            prefilterShader.uniformMatrix4fv('view', captureViews[i]);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, prefilterMap, mip);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            drawCube(gl);
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    const brdfLUTTexture: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, 512, 512, 0, gl.RG, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, brdfLUTTexture, 0);

    gl.viewport(0, 0, 512, 512);
    brdfShader.use();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    drawQuadWithTex(gl);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    const camera: OrbitCamera = new OrbitCamera(gl, 45, 0, 0, SCR_WIDTH / SCR_HEIGHT, 0.1, 1000.0);

    function drawCB(): void {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const view: mat4 = camera.getViewMatrix();
        const perspective: mat4 = camera.getPerspectiveMatrix();
        // const camPos: vec3 = camera.getPosition();
        const camPos: vec3 = camera.position;

        pbrShader.use();
        pbrShader.uniformMatrix4fv('view', view);
        pbrShader.uniformMatrix4fv('projection', perspective);
        pbrShader.uniform3fv('camPos', camPos);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilterMap);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);

        const model: mat4 = mat4.create();
        mat4.translate(model, model, [1.0, 1.0, 1.0]);
        mat4.scale(model, model, [5.0, 5.0, 5.0])
        const metallic: number = 0.9;
        const roughness: number = 0.05;
        // const metallic: number = 0.2;
        // const roughness: number = 0.35;
        pbrShader.uniform1f('metallic', metallic);
        pbrShader.uniform1f('roughness', roughness);
        pbrShader.uniformMatrix4fv('model', model);
        // drawCubeSmooth(gl);
        // drawCube(gl);
        renderSphere(gl);


        backgroundShader.use();
        backgroundShader.uniformMatrix4fv('projection', perspective);
        backgroundShader.uniformMatrix4fv('view', view);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

        drawCube(gl);
    }

    const looper = new RenderLooper(drawCB).start();
}




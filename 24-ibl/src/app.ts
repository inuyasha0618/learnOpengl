import { mat4, vec3 } from 'gl-matrix'
import RenderLooper from 'render-looper';
import { ShaderProgram, drawCube, OrbitCamera } from './gl-helpers/index';
import { getContext, resizeCvs2Screen, getRadian } from './utils/index';
import cubemapVertSrc from './shaders/cubemap';
import equirectangularFrag from './shaders/equirectangular_to_cubemap';
import backgroundVert from './shaders/backgroundVert';
import backgroundFrag from './shaders/backgroundFrag';

const gl: WebGL2RenderingContext = getContext('#cvs');
gl.getExtension('EXT_color_buffer_float');
const { width: SCR_WIDTH, height: SCR_HEIGHT } = resizeCvs2Screen(gl);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL)
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
const hdrTexture: WebGLTexture = gl.createTexture();

const myHDR = new HDRImage();
// myHDR.src = './hdr/Mans_Outside_2k.hdr';
myHDR.src = './hdr/Milkyway_small.hdr';
// myHDR.src = './hdr/Durham 1.hdr';
// myHDR.src = './hdr/Milkyway_Light.hdr';

myHDR.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, myHDR.width, myHDR.height, 0, gl.RGB, gl.FLOAT, myHDR.dataFloat);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

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
    const sixViews: Array<mat4> = [
        pos_x,
        neg_x,
        pos_y,
        neg_y,
        pos_z,
        neg_z
    ];

    console.log(`gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT}`)
    console.log(`gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: ${gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS}`)
    console.log(`gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT}`)
    console.log(`gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: ${gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE}`)

    const envCubemap: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    for (let i = 0; i < 6; i++) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, 512, 512, 0, gl.RGBA, gl.FLOAT, null);
    }

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const capturePerspective: mat4 = mat4.create();
    mat4.perspective(capturePerspective, getRadian(90), 1.0, 0.1, 10.0);

    const captureFBO: WebGLFramebuffer = gl.createFramebuffer();
    const captureDepthRBO: WebGLRenderbuffer = gl.createRenderbuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureDepthRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureDepthRBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, envCubemap, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error(`outputFbo error, status: ${gl.checkFramebufferStatus(gl.FRAMEBUFFER)}`);
    } else {
        console.log('outputFbo ok!');
    }


    const equirectangularShader: ShaderProgram = new ShaderProgram(gl, cubemapVertSrc, equirectangularFrag, 'equirectangularShader');
    const backgroundShader: ShaderProgram = new ShaderProgram(gl, backgroundVert, backgroundFrag, 'backgroundShader');

    backgroundShader.use();
    backgroundShader.uniform1i('environmentMap', 0);

    equirectangularShader.use();
    equirectangularShader.uniform1i('equirectangularMap', 0);
    equirectangularShader.uniformMatrix4fv('projection', capturePerspective);
    gl.viewport(0, 0, 512, 512);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
    for (let i = 0; i < 6; i++) {
        equirectangularShader.uniformMatrix4fv('view', sixViews[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        drawCube(gl);
    }

    const camera: OrbitCamera = new OrbitCamera(gl, 0.1, 0, 0., SCR_WIDTH / SCR_HEIGHT);
    gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    function drawCB(): void {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const view: mat4 = camera.getViewMatrix();
        const perspective: mat4 = camera.getPerspectiveMatrix();
        backgroundShader.use();
        backgroundShader.uniformMatrix4fv('projection', perspective);
        backgroundShader.uniformMatrix4fv('view', view);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

        // equirectangularShader.use();
        // equirectangularShader.uniformMatrix4fv('projection', perspective);
        // equirectangularShader.uniformMatrix4fv('view', view);
        // gl.activeTexture(gl.TEXTURE0);
        // gl.bindTexture(gl.TEXTURE_CUBE_MAP, hdrTexture);
        drawCube(gl);
    }

    const looper = new RenderLooper(drawCB).start();
}




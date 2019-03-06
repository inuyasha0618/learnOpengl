enum GBUFFER_TEXTURE_TYPE {
    GBUFFER_TEXTURE_TYPE_POSITION = 0,
    GBUFFER_TEXTURE_TYPE_ALBEDO,
    GBUFFER_TEXTURE_TYPE_NORMAL,
    GBUFFER_TEXTURE_TYPE_METALLIC,
    GBUFFER_TEXTURE_TYPE_ROUGHNESS,
    GBUFFER_TEXTURE_TYPE_AO,
    GBUFFER_NUM_TEXTURES
}

class GBuffer {
    fboGeo: WebGLFramebuffer;
    fboLighting: WebGLFramebuffer;
    fboOutput: WebGLFramebuffer;
    depthStencilBuffer: WebGLRenderbuffer;
    gl: WebGL2RenderingContext;
    windowWidth: number;
    windowHeight: number;
    colorTextures: Array<WebGLTexture> = [];
    outputTexture: WebGLTexture;
    constructor(gl: WebGL2RenderingContext, windowWidth: number, windowHeight: number) {
        this.gl = gl;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        this.init();
        // console.log(`gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT}`)
        // console.log(`gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: ${gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS}`)
        // console.log(`gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT}`)
        // console.log(`gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: ${gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE}`)
    }

    init(): boolean {
        const gl: WebGL2RenderingContext = this.gl;
        this.fboGeo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboGeo);
        // 创建数个颜色缓冲区
        for (let i = 0; i < GBUFFER_TEXTURE_TYPE.GBUFFER_NUM_TEXTURES; i++) {
            const texture: WebGLTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.windowWidth, this.windowHeight, 0, gl.RGBA, gl.FLOAT, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, texture, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.colorTextures.push(texture);
        }

        // 创建深度和模板缓冲区
        const rbo: WebGLRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH32F_STENCIL8, this.windowWidth, this.windowHeight);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo);
        this.depthStencilBuffer = rbo;

        const fboStatus: number = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

        this.fboOutput = gl.createFramebuffer();
        this.outputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.windowWidth, this.windowHeight, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboOutput);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        const rbo2: WebGLRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo2);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH32F_STENCIL8, this.windowWidth, this.windowHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo2);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(`fboOutput error, status: ${gl.checkFramebufferStatus(gl.FRAMEBUFFER)}`);
        } else {
            console.log('fboOutput ok!');
        }

        if (fboStatus !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(`FBO error, status: ${fboStatus}`);
            return false;
        }

        this.fboLighting = gl.createFramebuffer();

        const lightingRenderBuffer: WebGLRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, lightingRenderBuffer);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 8, gl.RGBA32F, this.windowWidth, this.windowHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboLighting);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, lightingRenderBuffer);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(`fboLighting error, status: ${gl.checkFramebufferStatus(gl.FRAMEBUFFER)}`);
        } else {
            console.log('fboLighting ok!');
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return true;
    }

    setForGeomPass(): void {
        const gl: WebGL2RenderingContext = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboGeo);
        gl.enable(gl.DEPTH_TEST);
        // gl.depthMask(true);
        const drawBuffers: Array<number> = [];
        for (let i = 0; i < GBUFFER_TEXTURE_TYPE.GBUFFER_NUM_TEXTURES; i++) {
            drawBuffers.push(gl.COLOR_ATTACHMENT0 + i)
        }
        gl.drawBuffers(drawBuffers);
    }

    setForLightingPass(): void {
        const gl: WebGL2RenderingContext = this.gl;
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fboGeo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fboOutput);
        gl.blitFramebuffer(0, 0, this.windowWidth, this.windowHeight, 0, 0, this.windowWidth, this.windowHeight, gl.DEPTH_BUFFER_BIT, gl.NEAREST);

        // gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboOutput);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboLighting);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_POSITION]);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_ALBEDO]);
    
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_NORMAL]);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_METALLIC]);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_ROUGHNESS]);

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_AO]);

        gl.enable(gl.DEPTH_TEST);
    }

    setForOutput(): void {
        const gl: WebGL2RenderingContext = this.gl;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fboLighting);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fboOutput);
        gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
        gl.blitFramebuffer(0, 0, this.windowWidth, this.windowHeight, 0, 0, this.windowWidth, this.windowHeight, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
    }
}

export default GBuffer;
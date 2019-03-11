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
    fbo: WebGLFramebuffer;
    outputFbo: WebGLFramebuffer;
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
        console.log(`gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT}`)
        console.log(`gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS: ${gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS}`)
        console.log(`gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: ${gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT}`)
        console.log(`gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: ${gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE}`)
    }

    init(): boolean {
        const gl: WebGL2RenderingContext = this.gl;
        this.fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        // 创建3个颜色缓冲区
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

        this.outputFbo = gl.createFramebuffer();
        this.outputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.windowWidth, this.windowHeight, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.outputFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);

        const rbo2: WebGLRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo2);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH32F_STENCIL8, this.windowWidth, this.windowHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo2);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(`outputFbo error, status: ${gl.checkFramebufferStatus(gl.FRAMEBUFFER)}`);
        } else {
            console.log('outputFbo ok!');
        }

        if (fboStatus !== gl.FRAMEBUFFER_COMPLETE) {
            console.error(`FBO error, status: ${fboStatus}`);
            return false;
        }
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return true;
    }

    setForGeomPass(): void {
        const gl: WebGL2RenderingContext = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
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
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.outputFbo);
        gl.blitFramebuffer(0, 0, this.windowWidth, this.windowHeight, 0, 0, this.windowWidth, this.windowHeight, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.outputFbo);

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

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, this.colorTextures[GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_AO]);

        gl.enable(gl.DEPTH_TEST);
    }

    setForOutput(): void {
        const gl: WebGL2RenderingContext = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
    }

    output2Screen(): void {
        // 仅调试使用
        const gl: WebGL2RenderingContext = this.gl;
        const winWidth = this.windowWidth;
        const winHeight = this.windowHeight;
        const halfWinWidth = 0.5 * winWidth;
        const halfWinHeight = 0.5 * winHeight;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbo);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.outputFbo);

        gl.readBuffer(gl.COLOR_ATTACHMENT0 + GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_POSITION);
        gl.blitFramebuffer(0, 0, winWidth, winHeight, 0, 0, halfWinWidth, halfWinHeight, gl.COLOR_BUFFER_BIT, gl.LINEAR);

        gl.readBuffer(gl.COLOR_ATTACHMENT0 + GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_ALBEDO);
        gl.blitFramebuffer(0, 0, winWidth, winHeight, halfWinWidth, 0, winWidth, halfWinHeight, gl.COLOR_BUFFER_BIT, gl.LINEAR);

        gl.readBuffer(gl.COLOR_ATTACHMENT0 + GBUFFER_TEXTURE_TYPE.GBUFFER_TEXTURE_TYPE_NORMAL);
        gl.blitFramebuffer(0, 0, winWidth, winHeight, 0, halfWinHeight, halfWinWidth, winHeight, gl.COLOR_BUFFER_BIT, gl.LINEAR);

    }
}

export default GBuffer;
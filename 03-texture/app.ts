const imgLoader = url => {
    const image: HTMLImageElement = new Image();
    image.src = url
    return new Promise((resolve, reject) => {
        image.onload = () => {
            resolve(image);
        };
        image.onerror = reject;
    })
}

class Shader {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    constructor(gl: WebGL2RenderingContext, vertexSrc: string, fragSrc: string) {
        this.gl = gl;
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSrc);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            throw `Vertex shader compile error: ${gl.getShaderInfoLog(vertexShader)}`;
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragSrc);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            throw `Fragment shader compile error: ${gl.getShaderInfoLog(fragmentShader)}`;
        }

        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw `Program link error: ${gl.getProgramInfoLog(this.program)}`;
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
    }

    use(): void {
        this.gl.useProgram(this.program);
    }

    getAttribLocation(name: string) {
        return this.gl.getAttribLocation(this.program, name);
    }

    setUniformInt(name: string, value: number) {
        const location = this.gl.getUniformLocation(this.program, name);
        this.gl.uniform1i(location, value);
    }
}

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');

const vertexSrc: string = document.querySelector('#vertex').textContent.trim();
const fragmentSrc: string = document.querySelector('#fragment').textContent.trim();

const program: Shader = new Shader(gl, vertexSrc, fragmentSrc);

const vbo = gl.createBuffer();
const ebo = gl.createBuffer();
const vao = gl.createVertexArray();

gl.bindVertexArray(vao);
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.5, -0.5, 0.0,  1.0, 0.0, 0.0,  0.0, 1.0,
    0.5, -0.5, 0.0,  0.0, 1.0, 0.0,  1.0, 1.0,
    0.5, 0.5, 0.0,  0.0, 0.0, 1.0,  1.0, 0.0,
    -0.5, 0.5, 0.0,  0.0, 1.0, 1.0,  0.0, 0.0
]), gl.STATIC_DRAW);

const aPos = program.getAttribLocation('aPos');
const aColor = program.getAttribLocation('aColor');
const aSt = program.getAttribLocation('aSt');

gl.vertexAttribPointer(
    aPos,
    3,
    gl.FLOAT,
    false,
    8 * Float32Array.BYTES_PER_ELEMENT,
    0
);

gl.vertexAttribPointer(
    aColor,
    3,
    gl.FLOAT,
    false,
    8 * Float32Array.BYTES_PER_ELEMENT,
    3 * Float32Array.BYTES_PER_ELEMENT,    
);

gl.vertexAttribPointer(
    aSt,
    2,
    gl.FLOAT,
    false,
    8 * Float32Array.BYTES_PER_ELEMENT,
    6 * Float32Array.BYTES_PER_ELEMENT,    
);

gl.enableVertexAttribArray(aPos);
gl.enableVertexAttribArray(aColor);
gl.enableVertexAttribArray(aSt);

gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
    0, 3, 1,
    1, 2, 3
]), gl.STATIC_DRAW);
gl.bindVertexArray(null);

gl.clearColor(0.0, 0.0, 0.0, 1.0);
const { width, height } = canvas.getBoundingClientRect();
gl.viewport(0, 0, width, height);
gl.enable(gl.DEPTH_TEST);

Promise.all([imgLoader('../images/container.jpg'), imgLoader('../images/awesomeface.png')])
    .then(([container, smile]) => {
        const texture1 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture1);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            (<HTMLImageElement>container).width,
            (<HTMLImageElement>container).height,
            0,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            (<HTMLImageElement>container)
        );

        gl.generateMipmap(gl.TEXTURE_2D);

        const texture2 = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture2);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            (<HTMLImageElement>smile).width,
            (<HTMLImageElement>smile).height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            (<HTMLImageElement>smile)
        );

        gl.generateMipmap(gl.TEXTURE_2D);

        program.use();
        program.setUniformInt('wood', 0);
        program.setUniformInt('smile', 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.bindVertexArray(vao);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    })





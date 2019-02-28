const loadImg = url => {
    const image: HTMLImageElement = new Image();
    image.src = url
    return new Promise((resolve, reject) => {
        image.onload = () => {
            resolve(image);
        };
        image.onerror = reject;
    })
}

class Texture {
    public tex: WebGLTexture;
    private ready: boolean = false;
    constructor(gl: WebGL2RenderingContext, url: string, wrapSMode: number, wrapTMode: number) {
        this.tex = gl.createTexture();
        this.loadTexture(gl, url, wrapSMode, wrapTMode);
    }

    loadTexture(gl: WebGL2RenderingContext, url: string, wrapSMode: number, wrapTMode: number): void {
        const format: number = /.*\.png$/.test(url) ? gl.RGBA : gl.RGB;
        loadImg(url).then(img => {
            const { width, height } = <HTMLImageElement>img;
            gl.bindTexture(gl.TEXTURE_2D, this.tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, <HTMLImageElement>img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapSMode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapTMode);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
            this.ready = true;
        })
    }
}

export default Texture;
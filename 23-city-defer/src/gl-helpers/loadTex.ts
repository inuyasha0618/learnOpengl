
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


function loadTex(url: string, tex: WebGLTexture, gl: WebGL2RenderingContext): void {
    const format: number = /.*\.png$/.test(url) ? gl.RGBA : gl.RGB;
    loadImg(url).then(img => {
        const { width, height } = <HTMLImageElement>img;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, <HTMLImageElement>img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    })
}

export default loadTex;
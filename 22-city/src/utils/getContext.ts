function getContext(id: string): WebGL2RenderingContext {
    const canvas: HTMLCanvasElement = document.querySelector(id);
    let gl: WebGL2RenderingContext = canvas.getContext('webgl2');
    if (!gl) throw 'This browser doesnot support webgl2.0';
    return gl;
}

export default getContext;
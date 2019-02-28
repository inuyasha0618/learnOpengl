interface Output {
    width: number;
    height: number;
}

function resizeCvs2Screen(gl: WebGL2RenderingContext): Output {
    const SCR_WIDTH = document.documentElement.clientWidth || document.body.clientWidth;
    const SCR_HEIGHT = document.documentElement.clientHeight || document.body.clientHeight;

    const cvs: HTMLCanvasElement = gl.canvas;
    cvs.width = SCR_WIDTH;
    cvs.height = SCR_HEIGHT;
    cvs.style.width = `${SCR_WIDTH}px`;
    cvs.style.height = `${SCR_HEIGHT}px`;

    gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);

    return {
        width: SCR_WIDTH,
        height: SCR_HEIGHT
    };
}

export default resizeCvs2Screen;
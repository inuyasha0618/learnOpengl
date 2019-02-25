const fragmentSrc = `
    #version 300 es
    precision mediump float;

    uniform sampler2D DIFFUSE_TEXTURE0;
    uniform sampler2D SPECULAR_TEXTURE0;

    out vec4 fragColor;

    void main() {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`.trim();

export default fragmentSrc;
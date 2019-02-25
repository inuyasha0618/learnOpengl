const source: string = `
    #version 300 es
    precision mediump float;
    uniform sampler2D tex;
    in vec2 vTexcord;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(texture(tex, vTexcord).rgb, 1.0);
    }
`.trim();

export default source;
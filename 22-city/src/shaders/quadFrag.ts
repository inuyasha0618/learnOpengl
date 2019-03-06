const quadFrag: string = `
    #version 300 es
    precision mediump float;
    uniform sampler2D tex;
    uniform vec2 screenSize;
    out vec4 fragColor;
    void main() {
        vec2 vTexcord = gl_FragCoord.xy / screenSize;
        fragColor = vec4(texture(tex, vTexcord).rgb, 1.0);
    }
`.trim();

export default quadFrag;
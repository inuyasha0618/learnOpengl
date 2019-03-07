const source: string = `
    #version 300 es
    precision mediump float;
    uniform sampler2D hdr_tex;
    uniform sampler2D blur_tex;
    uniform float exposure;
    uniform vec2 screenSize;
    out vec4 fragColor;
    void main() {
        vec2 vTexcord = gl_FragCoord.xy / screenSize;
        float gamma = 2.2;
        vec3 hdr_color = texture(hdr_tex, vTexcord).rgb;
        vec3 blur_color = texture(blur_tex, vTexcord).rgb;
        vec3 result = hdr_color + blur_color;
        result = vec3(1.0) - exp(-exposure * result);
        result = pow(result, vec3(1.0 / gamma));
        fragColor = vec4(result, 1.0);
    }
`.trim();

export default source;
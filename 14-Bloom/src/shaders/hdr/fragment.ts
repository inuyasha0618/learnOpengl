const fragSrc = `
    #version 300 es
    precision mediump float;
    uniform sampler2D tex;
    uniform float exposure;

    in vec2 vTexcord;
    out vec4 fragColor;
    void main() {
        float gamma = 2.2;
        vec3 hdrColor = texture(tex, vTexcord).rgb;
        vec3 result = vec3(1.0) - exp(-hdrColor * exposure);
        result = pow(result, vec3(1.0 / gamma));
        fragColor = vec4(result, 1.0);
    }
`.trim();

export default fragSrc;
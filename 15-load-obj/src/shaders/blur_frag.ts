const source: string = `
    #version 300 es
    precision mediump float;
    uniform bool horizontal;
    uniform sampler2D tex;
    uniform float weight[5];
    in vec2 vTexcord;
    out vec4 fragColor;
    void main() {
        vec2 texel_size = vec2(1.0) / float(textureSize(tex, 0));
        vec3 result = weight[0] * texture(tex, vTexcord).rgb;
        if (horizontal) {
            for (int i = 1; i < 5; i++) {
                result += weight[i] * texture(tex, vTexcord + vec2(texel_size.x * float(i), 0.0)).rgb;
                result += weight[i] * texture(tex, vTexcord - vec2(texel_size.x * float(i), 0.0)).rgb;
            }
        } else {
            for (int i = 1; i < 5; i++) {
                result += weight[i] * texture(tex, vTexcord + vec2(0.0, texel_size.y * float(i))).rgb;
                result += weight[i] * texture(tex, vTexcord - vec2(0.0, texel_size.y * float(i))).rgb;
            }
        }
        fragColor = vec4(result, 1.0);
    }
`.trim();

export default source;
const lightFrag: string = `
#version 300 es
precision mediump float;
in vec3 vLightColor;
in vec2 vTexcord;
in float vTime;
layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 highLightColor;

float N21(vec2 p);

void main() {
    float exposure = 1.0;
    vec3 color = vLightColor;
    color = mix(0.005, 1.0, ((sin(2. * vTime + N21(vLightColor.xy) * 20. )) * 0.5 + 0.5)) * color;
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    if (brightness > 1.0) {
        highLightColor = vec4(color, 1.0);
    } else {
        highLightColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
    fragColor = vec4(color, 1.0);
}

float N21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
}
`.trim();

export default lightFrag;
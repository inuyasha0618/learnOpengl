const lightFrag: string = `
#version 300 es
precision mediump float;
uniform vec3 lightColor;
uniform sampler2D tex;
in vec2 vTexcord;
out vec4 fragColor;
void main() {
    vec3 color = 100.0 * texture(tex, vTexcord).rgb;
    color = color / (color + vec3(1.0));
    // gamma correct
    color = pow(color, vec3(1.0/2.2)); 
    fragColor = vec4(color, 1.0);
}
`.trim();

export default lightFrag;
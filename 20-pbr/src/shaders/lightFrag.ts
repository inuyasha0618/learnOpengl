const lightFrag: string = `
#version 300 es
precision mediump float;
uniform vec3 lightColor;
out vec4 fragColor;
void main() {
    fragColor = vec4(lightColor, 1.0);
}
`.trim();

export default lightFrag;
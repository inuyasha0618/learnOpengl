const cubeFrag: string = `
    #version 300 es
    precision mediump float;
    in vec3 vPosWorld;
    in vec3 vNormal;
    in vec2 vTexcord;
    layout (location = 0) out vec4 fragPos;
    layout (location = 1) out vec4 fragDiffuse;
    layout (location = 2) out vec4 fragNormal;
    uniform sampler2D cubeTex;
    uniform float texYOffset;
    void main() {
        fragPos = vec4(vPosWorld, 1.0);
        fragDiffuse = vec4(texture(cubeTex, vTexcord + vec2(0.0, texYOffset)).rgb, 1.0);
        fragNormal = vec4(vNormal, 1.0);
    }
`.trim();
export default cubeFrag;
const testCubeFrag: string = `
    #version 300 es
    precision mediump float;
    in vec3 vPosWorld;
    in vec3 vNormal;
    in vec2 vTexcord;
    out vec4 fragDiffuse;
    uniform sampler2D cubeTex;
    void main() {
        fragDiffuse = vec4(texture(cubeTex, vTexcord).rgb, 1.0);
    }
`.trim();
export default testCubeFrag;
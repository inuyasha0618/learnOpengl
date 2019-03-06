const geoFrag: string = `
    #version 300 es
    precision mediump float;
    in vec3 vPosWorld;
    in vec3 vNormal;
    in vec2 vTexcord;
    in vec3 vAlbedo;
    in float vMetallic;
    in float vRoughness;
    in float vAo;

    layout (location = 0) out vec4 fragPos;
    layout (location = 1) out vec4 fragAlbedo;
    layout (location = 2) out vec4 fragNormal;
    layout (location = 3) out vec4 fragMetallic;
    layout (location = 4) out vec4 fragRoughness;
    layout (location = 5) out vec4 fragAo;
    uniform sampler2D cubeTex;
    void main() {
        fragPos = vec4(vPosWorld, 1.0);
        fragAlbedo = vec4(vAlbedo, 1.0);
        fragNormal = vec4(vNormal, 1.0);
        fragMetallic = vec4(vMetallic, 0.0, 0.0, 1.0);
        fragRoughness = vec4(vRoughness, 0.0, 0.0, 1.0);
        fragAo = vec4(vAo, 0.0, 0.0, 1.0);
    }
`.trim();
export default geoFrag;
const geoVert: string = `
    #version 300 es
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexcord;
    
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;
    uniform vec3 albedo;
    uniform float metallic;
    uniform float roughness;
    uniform float ao;

    out vec3 vPosWorld;
    out vec3 vNormal;
    out vec2 vTexcord;
    out vec3 vAlbedo;
    out float vMetallic;
    out float vRoughness;
    out float vAo;

    void main() {
        vPosWorld = (uModel * vec4(aPos, 1.0)).xyz;
        vNormal = (transpose(inverse(uModel)) * vec4(aNormal, 1.0)).xyz;
        vTexcord = aTexcord;
        vAlbedo = albedo;
        vMetallic = metallic;
        vRoughness = roughness;
        vAo = ao;
        gl_Position = uPerspective * uView * vec4(vPosWorld, 1.0);
    }
`.trim();

export default geoVert;
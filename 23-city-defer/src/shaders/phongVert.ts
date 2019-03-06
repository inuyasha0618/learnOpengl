const cubeVert: string = `
    #version 300 es
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexcord;
    out vec3 vPosWorld;
    out vec3 vNormal;
    out vec2 vTexcord;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;
    void main() {
        vPosWorld = (uModel * vec4(aPos, 1.0)).xyz;
        vNormal = (transpose(inverse(uModel)) * vec4(aNormal, 1.0)).xyz;
        vTexcord = aTexcord;
        gl_Position = uPerspective * uView * vec4(vPosWorld, 1.0);
    }
`.trim();

export default cubeVert;
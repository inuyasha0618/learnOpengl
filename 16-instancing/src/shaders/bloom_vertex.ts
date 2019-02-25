const vertexSrc = `
    #version 300 es

    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexcord;

    uniform mat4 perspective;
    uniform mat4 view;
    uniform mat4 model;

    out vec3 frag_pos_world;
    out vec3 frag_normal_world;
    out vec2 frag_texcord;

    void main() {
        frag_pos_world = (model * vec4(aPos, 1.0)).xyz;
        frag_normal_world = mat3(transpose(inverse(model))) * aNormal;
        frag_texcord = aTexcord;
        gl_Position = perspective * view * vec4(frag_pos_world, 1.0);
    }

`.trim();

export default vertexSrc;
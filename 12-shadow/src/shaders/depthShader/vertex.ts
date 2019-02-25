const vertexSrc = `
    #version 300 es
    layout (location = 0) in vec3 aPos;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uPerspective;
    out vec3 frag_pos_world;

    void main() {
        frag_pos_world = vec3(uModel * vec4(aPos, 1.0));
        gl_Position = uPerspective * uView * vec4(frag_pos_world, 1.0);
    }
`.trim();

export default vertexSrc;
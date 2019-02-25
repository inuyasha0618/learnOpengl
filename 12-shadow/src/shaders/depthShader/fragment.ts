const fragmentSrc = `
    #version 300 es
    precision mediump float;
    uniform float far_plane;
    uniform vec3 light_pos_world;
    in vec3 frag_pos_world;

    void main() {
        float distance = length(frag_pos_world - light_pos_world);
        distance /= far_plane;
        gl_FragDepth = distance;
    }
`.trim();

export default fragmentSrc;
const fragSrc: string = `
    #version 300 es
    precision mediump float;

    layout (location = 0) out vec4 fragColor;
    layout (location = 1) out vec4 brightColor;

    uniform vec3 lightColor;
    void main() {
        float brightness = dot(lightColor, vec3(0.2126, 0.7152, 0.0722));
        if (brightness > 1.0) {
            brightColor = vec4(lightColor, 1.0);
        } else {
            brightColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
        fragColor = vec4(lightColor, 1.0);
    }
`.trim();

export default fragSrc;
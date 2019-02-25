const fragSrc = `
    #version 300 es
    precision mediump float;
    
    #define NUMS_OF_LIGHTS 4

    struct PointLight {
        vec3 color;
        vec3 position;
    };

    uniform sampler2D tex;
    uniform PointLight lights[NUMS_OF_LIGHTS];
    
    in vec3 frag_pos_world;
    in vec3 frag_normal_world;
    in vec2 frag_texcord;


    layout (location = 0) out vec4 fragColor;
    layout (location = 1) out vec4 brightColor;

    vec3 calcuLight(vec3 frag_pos, vec3 frag_normal, vec2 frag_texcord, PointLight light) {
        vec3 color = vec3(0.0, 0.0, 0.0);
        vec3 material_color = texture(tex, frag_texcord).rgb;
        vec3 ambient = vec3(0.0) * light.color * material_color;
        vec3 lightDir = normalize(light.position - frag_pos);
        vec3 norm = normalize(frag_normal);
        float diff = max(dot(lightDir, norm), 0.0);
        vec3 diffuse = vec3(0.2) * light.color * material_color * diff;
        float distance = length(light.position - frag_pos);
        color = (ambient + diffuse) / (distance * distance);
        return color;
    }

    void main() {
        vec3 color = vec3(0.0, 0.0, 0.0);
        for (int i = 0; i < NUMS_OF_LIGHTS; i++) {
            color += calcuLight(frag_pos_world, frag_normal_world, frag_texcord, lights[i]);
        }
        fragColor = vec4(color, 1.0);
        float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
        if (brightness > 1.0) {
            brightColor = fragColor;
        } else {
            brightColor = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }

`.trim();

export default fragSrc;
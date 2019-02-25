const fragmentSrc = `
    #version 300 es
    precision mediump float;

    uniform vec3 uViewPos;

    struct Material {
        sampler2D diffuse;
        sampler2D specular;
        float shininess;
    };

    struct Light {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 position;
        vec3 direction;
        float cutOff;
        float outCutOff;

        float constant;
        float linear;
        float quadratic;
    };

    uniform Material material;
    uniform Light light;

    in vec3 vNormal;
    in vec3 vFragPos;
    in vec2 vTexCord;

    out vec4 fragColor;

    void main() {
        vec3 ambient = vec3(0.0, 0.0, 0.0);
        vec3 diffuse = vec3(0.0, 0.0, 0.0);
        vec3 specular = vec3(0.0, 0.0, 0.0);

        vec3 fragDir = normalize(vFragPos - light.position);
        

        float distance = length(light.position - vFragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
        vec3 lightDir = normalize(light.position - vFragPos);
        // vec3 lightDir = normalize(-light.direction);
        float theta = dot(-lightDir, normalize(light.direction));
        float intensity = clamp((theta - light.outCutOff) / (light.cutOff - light.outCutOff), 0.0, 1.0);

        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec3 normal = normalize(vNormal);
        vec3 reflectDir = normalize(reflect(-lightDir, normal));

        float diff = max(dot(lightDir, normal), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        ambient = light.ambient * vec3(texture(material.diffuse, vTexCord)) * attenuation;
        diffuse = light.diffuse * vec3(texture(material.diffuse, vTexCord)) * diff * attenuation * intensity;
        specular = light.specular * vec3(texture(material.specular, vTexCord)) * spec * attenuation * intensity;
        fragColor = vec4(ambient + diffuse + specular, 1.0);
    }
`.trim();

export default fragmentSrc;
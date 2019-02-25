const fragmentSrc = `
    #version 300 es
    precision mediump float;

    struct Material {
        float shininess;
    };

    struct DirLight {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 direction;
    };

    struct PointLight {
        vec3 ambient;
        vec3 diffuse;
        vec3 specular;
        vec3 position;

        float constant;
        float linear;
        float quadratic;
    };

    struct SpotLight {
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

    #define NUM_OF_POINTLIGHTS 4
    uniform vec3 uViewPos;
    uniform Material material;
    uniform sampler2D DIFFUSE_TEXTURE0;
    uniform sampler2D SPECULAR_TEXTURE0;
    uniform DirLight dirLight;
    uniform PointLight pointLights[NUM_OF_POINTLIGHTS];
    uniform SpotLight spotLight;

    in vec3 vNormal;
    in vec3 vFragPos;
    in vec2 vTexCord;

    out vec4 fragColor;

    vec3 calcDirLight(DirLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord);
    vec3 calcPointLight(PointLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos);
    vec3 calcSpotLight(SpotLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos);

    void main() {
        vec3 viewDir = normalize(uViewPos - vFragPos);
        vec3 dirLightColor = calcDirLight(dirLight, material, vNormal, viewDir, vTexCord);
        vec3 pointLightColor = vec3(0.0, 0.0, 0.0);
        for (int i = 0; i < NUM_OF_POINTLIGHTS; i++) {
            pointLightColor += calcPointLight(pointLights[i], material, vNormal, viewDir, vTexCord, vFragPos);
        }
        
        vec3 spotLightColor = calcSpotLight(spotLight, material, vNormal, viewDir, vTexCord, vFragPos);
        fragColor = vec4((dirLightColor + pointLightColor + spotLightColor), 1.0);
    }

    vec3 calcDirLight(DirLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord) {
        vec3 lightDir = normalize(-light.direction);
        vec3 norm = normalize(normal);
        vec3 reflectDir = normalize(reflect(-lightDir, norm));

        float diff = max(dot(lightDir, norm), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        vec3 ambient = light.ambient * texture(DIFFUSE_TEXTURE0, texCord).rgb;
        vec3 diffuse = light.diffuse * texture(DIFFUSE_TEXTURE0, texCord).rgb * diff;
        vec3 specular = light.specular * texture(SPECULAR_TEXTURE0, texCord).rgb * spec;

        return ambient + diffuse + specular;
    }

    vec3 calcPointLight(PointLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos) {
        vec3 lightDir = normalize(light.position - fragPos);
        vec3 norm = normalize(normal);
        vec3 reflectDir = normalize(reflect(-lightDir, norm));

        float distance = length(light.position - fragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);

        float diff = max(dot(lightDir, norm), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        vec3 ambient = light.ambient * texture(DIFFUSE_TEXTURE0, texCord).rgb * attenuation;
        vec3 diffuse = light.diffuse * texture(DIFFUSE_TEXTURE0, texCord).rgb * diff * attenuation;
        vec3 specular = light.specular * texture(SPECULAR_TEXTURE0, texCord).rgb * spec * attenuation;

        return (ambient + diffuse + specular);
    }

    vec3 calcSpotLight(SpotLight light, Material material, vec3 normal, vec3 viewDir, vec2 texCord, vec3 fragPos) {
        vec3 fragDir = normalize(fragPos - light.position);

        float distance = length(light.position - fragPos);
        float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * distance * distance);
        vec3 lightDir = normalize(light.position - fragPos);
        float theta = dot(-lightDir, normalize(light.direction));
        float intensity = clamp((theta - light.outCutOff) / (light.cutOff - light.outCutOff), 0.0, 1.0);

        vec3 norm = normalize(normal);
        vec3 reflectDir = normalize(reflect(-lightDir, norm));

        float diff = max(dot(lightDir, norm), 0.0);
        float spec = pow(max(dot(reflectDir, viewDir), 0.0), material.shininess);

        vec3 ambient = light.ambient * vec3(texture(DIFFUSE_TEXTURE0, vTexCord)) * attenuation;
        vec3 diffuse = light.diffuse * vec3(texture(DIFFUSE_TEXTURE0, vTexCord)) * diff * attenuation * intensity;
        vec3 specular = light.specular * vec3(texture(SPECULAR_TEXTURE0, vTexCord)) * spec * attenuation * intensity;
        return ambient + diffuse + specular;
    }
`.trim();

export default fragmentSrc;
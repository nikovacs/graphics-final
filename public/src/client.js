/**
 * Authors:
 * - Nikolas Kovacs
 * - Jackson Wagner
 */

// Final Project: Tour of Moravian Campus
'use strict';

// Global WebGL context variable
let gl;

let self = {
    pos: [0, 0, 0],
    x_rot: 0,
    y_rot: 0,
    animation: "idle"
}

// Once the document is fully loaded run this init function.
window.addEventListener('load', function init() {
    // Get the HTML5 canvas object from it's ID
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) { window.alert('Could not find #webgl-canvas'); return; }

    // Get the WebGL context (save into a global variable)
    gl = canvas.getContext('webgl2');
    if (!gl) { window.alert("WebGL isn't available"); return; }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height); // this is the region of the canvas we want to draw on (all of it)
    gl.clearColor(0.2, 0.2, 0.2, 1); // setup the background color with red, green, blue, and alpha
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Initialize the WebGL program and data
    gl.program = initProgram();
    initEvents();
    initBuffers();
    

    // Set initial values of uniforms
    updateProjectionMatrix();
    updateModelViewMatrix();
    // let mv = mat4.create();
    // mat4.rotateX(mv, mv, Math.PI / 2);
    // mat4.translate(mv, mv, [0, -10, 0])
    // gl.uniformMatrix4fv(gl.program.uModelViewMatrix, false, mv);
    // gl.uniform1i(gl.program.uTexture, 0);


    // Render the static scene
    // onWindowResize();
    // render();
});


/**
 * Initializes the WebGL program.
 */
function initProgram() {
    // Compile shaders
    // Vertex Shader
    let vert_shader = compileShader(gl, gl.VERTEX_SHADER,
        `#version 300 es
        precision mediump float;

        // Matrices
        //uniform mat4 uViewMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        // Light Position
        const vec4 light = vec4(0, 1, 0, 0);

        // Attributes for the vertex (from VBOs)
        in vec4 aPosition;
        in vec3 aNormal;
        in vec2 aTexCoord;

        // Vectors (varying variables to vertex shader)
        out vec3 vNormalVector;
        out vec3 vLightVector;
        out vec3 vEyeVector;
        out vec2 vTexCoord;

        void main() {
            mat4 mv = uModelViewMatrix;// * uViewMatrix;
            vec4 P = mv * aPosition;

            vNormalVector = mat3(mv) * aNormal;
            vec4 lightPos = light;//uViewMatrix * light;
            vLightVector = lightPos.w == 1.0 ? P.xyz - lightPos.xyz : lightPos.xyz;
            vEyeVector = -P.xyz;

            gl_Position = uProjectionMatrix * P;

            vTexCoord = aTexCoord;
        }`
    );
    // Fragment Shader - Phong Shading and Reflections
    let frag_shader = compileShader(gl, gl.FRAGMENT_SHADER,
        `#version 300 es
        precision mediump float;

        uniform sampler2D uTexture;

        // Light and material properties
        const vec3 lightColor = vec3(1, 1, 1);
        uniform vec4 uMaterialColor;
        const float materialAmbient = 1.0;
        const float materialDiffuse = 0.0;
        const float materialSpecular = 0.0;
        const float materialShininess = 0.0;

        // Vectors (varying variables from vertex shader)
        in vec3 vNormalVector;
        in vec3 vLightVector;
        in vec3 vEyeVector;
        in vec2 vTexCoord;

        // Output color
        out vec4 fragColor;

        void main() {
            // Normalize vectors
            vec3 N = normalize(vNormalVector);
            vec3 L = normalize(vLightVector);
            vec3 E = normalize(vEyeVector);

            // Compute lighting
            float diffuse = dot(-L, N);
            float specular = 0.0;
            if (diffuse < 0.0) {
                diffuse = 0.0;
            } else {
                vec3 R = reflect(L, N);
                specular = pow(max(dot(R, E), 0.0), materialShininess);
            }
            
            // Compute final color
            vec4 color = texture(uTexture, vTexCoord);// * materialColor;

            // Compute final color
            fragColor.rgb = lightColor * (
                (materialAmbient + materialDiffuse * diffuse) * color.rgb +
                materialSpecular * specular);
            fragColor.a = color.a;
        }`
    );

    // Link the shaders into a program and use them with the WebGL context
    let program = linkProgram(gl, vert_shader, frag_shader);
    gl.useProgram(program);

    // Get the attribute indices
    program.aPosition = gl.getAttribLocation(program, 'aPosition');
    program.aNormal = gl.getAttribLocation(program, 'aNormal');
    program.aTexCoord = gl.getAttribLocation(program, 'aTexCoord');

    // Get the uniform indices
    program.uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
    program.uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    program.uMaterialColor = gl.getUniformLocation(program, 'uMaterialColor');
    program.uTexture = gl.getUniformLocation(program, 'uTexture');

    return program;
}

function initBuffers() {
    gl.models = [];

    for (let i = 0; i <= 74; i++) {
        gl.models.push(loadModel(`models/moraviancampusreduced_${i}.json`));
    }

    Promise.all(gl.models)
        .then((models) => {
            const imagePromises = models.map((model, idx) => {
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onerror = reject;
                    image.src = "images/" + model.texture;
                    image.addEventListener('load', () => {
                        model.texture = loadTexture(gl, image, idx);
                        model.idx = idx;
                        resolve();
                    });
                });
            });
            Promise.all(imagePromises)
                .then(async () => {
                    gl.models = await Promise.all(gl.models)
                    onWindowResize();
                    render();
                })
        })
}

function initEvents() {
    setDefaultListeners();
}

/**
 * Update the projection matrix.
 */
function updateProjectionMatrix() {
    let aspect = gl.canvas.width / gl.canvas.height;
    let p = mat4.perspective(mat4.create(), Math.PI / 4, aspect, 0.1, null);
    gl.uniformMatrix4fv(gl.program.uProjectionMatrix, false, p);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let model of gl.models) {
        // console.log(model.coords.length/3, model.indices.length)
        // console.log(model.filename)
        gl.bindVertexArray(model.vao);
        gl.uniform1i(gl.program.uTexture, model.idx);
        gl.activeTexture(gl.TEXTURE0 + model.idx);
        gl.bindTexture(gl.TEXTURE_2D, model.texture);

        // // gl.uniform4fv(gl.program.uMaterialColor, model.materialColor);
        gl.drawElements(model.drawMode, model.numElements, gl.UNSIGNED_SHORT, 0);
    }
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    window.requestAnimationFrame(render);
}

/**
 * Keep the canvas sized to the window.
 */
function onWindowResize() {
    gl.canvas.width = window.innerWidth;
    gl.canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    updateProjectionMatrix();
}

function updateModelViewMatrix(directionVector = [0,0,0]) {
    let mv = mat4.create();
    mv.rotateY(mv, mv, degToRad(player_pos.y_rot))
    vec3.transformMat4(directionVector, directionVector, mat4.invert(mat4.create(), mv))
    

}

function degToRad(deg) {
    return deg * Math.PI / 180.0;
}
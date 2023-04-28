// function getScene(){

// }

// function initEvents(){
//     window.addEventListener('keydown', function (e) {
//         if (e.code === "ArrowUp") {
//             walk()
//         }
//     }
//     )
//     window.addEventListener('keydown', function (e) {
//         if (e.code === "KeyW") {
//             wave()
//         }
//     })
// }


/**
 * Create all components of the scene for the robot arm including the buffers,
 * scene graph nodes, and the listeners for the sliders.
 * 
 * Returns the VAO and the root scene node.
 */
function initCharacter() {
    // Colors
    let shirt = [0.0, 0.5, 0.0, 1.0];
    let jeans = [0.06, 0.3, 0.55, 1.0];
    let skin  = [1.0, 0.85, 0.05, 1.0];
    let black = [0.0, 0.0, 0.0, 1.0];

    // Create drawables to use for all parts
    // Note: cube() takes a list of width, height, and depth
    // Note: cylinder() takes two args: height and diameter
    let vertices = [], normals = [], indices = [];
    let [torso_start, torso_count] = cube(vertices, normals, indices, [0.2, 0.35, 0.2]);
    let [neck_start, neck_count] = cube(vertices, normals, indices, [0.05, 0.02, 0.05]);
    let [head_start, head_count] = cylinder(vertices, normals, indices, 0.16, 0.16);
    let [leg_start, leg_count] = cube(vertices, normals, indices, [0.09, 0.2, 0.1]);
    let [arm_start, arm_count] = cube(vertices, normals, indices, [0.06, 0.30, 0.1]);


    // Create the VAO
    let vao = createVAO(gl, gl.program, {
        "aPosition": [vertices, 3],
        "aNormal": [normals, 3],
    }, indices);

    // Create the scene graph of all of the body parts

    let head = createNode({
        'position': [0, 0.09, 0],
        'color': skin,
        'start': head_start,
        'count': head_count,
    });
    setupListener(head, 'yes-angle', 0); // X angle

    let neck = createNode({
        'position': [0, 0.35/2, 0],
        'color': skin,
        'start': neck_start,
        'count': neck_count,
        'children': [head],
    });
    setupListener(neck, 'no-angle', 1); // Y angle

    let left_arm = createNode({
        'color': skin,
        'start': arm_start,
        'origin': [0, 0.25/2, 0],
        'count': arm_count,
        'position': [-.12, .025, 0],
    });

    setupListener(left_arm, 'l-shoulder-x-angle', 2); // Z angle
    let right_arm = copyNode(left_arm, {'position': [.12, .025, 0]});
    setupListener(right_arm, 'r-shoulder-x-angle', 2)

    let left_leg = createNode({
        'color': jeans,
        'start': leg_start,
        'origin': [0, 0.55/2, 0],
        'count': leg_count,
        'position': [-.06, -0.55/2, 0],
    });
    left_leg.rotation[0] = 5;
    updateTransformation(left_leg);
    // setupListener(left_leg, 'l-leg-x-angle', 0); // X angle
    let right_leg = copyNode(left_leg, {'position': [.06, -0.55/2, 0]});
    right_leg.rotation[0] = -5
    updateTransformation(right_leg)
    // setupListener(right_leg, 'r-leg-x-angle', 0)
    
    let torso = createNode({
        'color': shirt,
        'start': torso_start,
        'count': torso_count,
        'children': [neck, left_leg, right_leg, left_arm, right_arm],
    });
    setupListener(torso, 'body-angle', 1); // Y angle

    // Return the information
    return [vao, torso];
}


// /**
//  * Initializes the WebGL program.
//  */
// function initProgram() {
//     // Compile shaders
//     // Vertex Shader
//     let vert_shader = compileShader(gl, gl.VERTEX_SHADER,
//         `#version 300 es
//         precision mediump float;

//         uniform mat4 uModelViewMatrix;
//         uniform mat4 uProjectionMatrix;
//         uniform vec4 uLight;

//         in vec4 aPosition;
//         in vec3 aNormal;

//         out vec3 vNormalVector;
//         out vec3 vLightVector;
//         out vec3 vEyeVector;

//         void main() {
//             vec4 P = uModelViewMatrix * aPosition;
//             vNormalVector = mat3(uModelViewMatrix) * aNormal;
//             vLightVector = uLight.w == 1.0 ? P.xyz - uLight.xyz : uLight.xyz;
//             vEyeVector = P.xyz;
//             gl_Position = uProjectionMatrix * P;
//         }`
//     );
//     // Fragment Shader - Phong Shading and Reflections
//     let frag_shader = compileShader(gl, gl.FRAGMENT_SHADER,
//         `#version 300 es
//         precision mediump float;

//         // Light and material properties
//         const vec3 lightColor = vec3(1, 1, 1);
//         uniform vec4 uMaterialColor;
//         const float materialAmbient = 0.2;
//         const float materialDiffuse = 0.5;
//         const float materialShininess = 10.0;

//         // Vectors (varying variables from vertex shader)
//         in vec3 vNormalVector;
//         in vec3 vLightVector;
//         in vec3 vEyeVector;

//         out vec4 fragColor;

//         void main() {
//             // Normalize vectors
//             vec3 N = normalize(vNormalVector);
//             vec3 L = normalize(vLightVector);
//             vec3 E = normalize(vEyeVector);

//             // Compute lighting
//             float diffuse = dot(-L, N);
//             float specular = 0.0;
//             if (diffuse < 0.0) {
//                 diffuse = 0.0;
//             } else {
//                 vec3 R = reflect(L, N);
//                 specular = pow(max(dot(R, E), 0.0), materialShininess);
//             }
            
//             // Compute final color
//             fragColor.rgb = lightColor * (
//                 (materialAmbient + materialDiffuse * diffuse) * uMaterialColor.rgb + specular
//             );
//             fragColor.a = uMaterialColor.a;
//         }`
//     );

//     // Link the shaders into a program and use them with the WebGL context
//     let program = linkProgram(gl, vert_shader, frag_shader);
//     gl.useProgram(program);
    

//     // Get the uniform indices
//     program.uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
//     program.uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
//     program.uMaterialColor = gl.getUniformLocation(program, 'uMaterialColor');
//     program.uLight = gl.getUniformLocation(program, 'uLight');

//     return program;
// }

/**
 * Render the scene.
 */
// function render(ms) {
//     // Clear
//     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//     if (!ms) { ms = performance.now(); }
//     gl.time_factor = ms*Math.PI/1000;
    
//     // Our scene uses a single VAO for all objects (may not always be true!)
//     gl.bindVertexArray(gl.vao);

//     renderNode(gl.scene, modelViewMatrix)
    

//     // Cleanup
//     gl.bindVertexArray(null);

//     // Animate
//     window.requestAnimationFrame(render);
// }

/**
 * Render a node in the scene graph. If it has children, this is recursively
 * called on those children.
 * @param {object} node node to render
 * @param {object} mv current model view matrix (not including this node)
 * @param {object} playerInfo object containing information about the player,
 *     including the current position and rotation
 */
function renderCharacter(node, mv) {
    // Compute global transformation from node's local transformation
    mat4.multiply(node.temp, mv, node.transform)

    // log xyz coords of node.temp
    console.log(node.temp[12], node.temp[13], node.temp[14])

    // Update the model view matrix uniform
    gl.uniformMatrix4fv(gl.program.uModelViewMatrix, false, node.temp);

    // Update the color uniform
    gl.uniform4fv(gl.program.uMaterialColor, node.color);

    // Draw the object
    gl.drawElements(node.mode, node.count, gl.UNSIGNED_SHORT, node.start*Uint16Array.BYTES_PER_ELEMENT);

    // Render all child nodes
    for (let child of node.children) {
        renderCharacter(child, node.temp)
    }
}

/**
 * Keep the canvas sized to the window.
 */
// function onWindowResize() {
//     let size = Math.min(window.innerWidth, window.innerHeight);
//     gl.canvas.width = gl.canvas.height = size;
//     gl.canvas.style.width = gl.canvas.style.height = size + 'px';
//     gl.viewport(0, 0, size, size);
//     updateProjectionMatrix();
// }

/**
 * Updates the projection matrix.
 */
// function updateProjectionMatrix() {
//     let aspect = gl.canvas.width / gl.canvas.height;
//     let p = mat4.perspective(mat4.create(), Math.PI / 4, aspect, 0.1, 10);
//     mat4.translate(p, p, [0, -0.1, -2]); // move the camera back by 1 so origin is visible
//     gl.uniformMatrix4fv(gl.program.uProjectionMatrix, false, p);
// }


//////////////////// SCENE GRAPH FUNCTIONS ////////////////////

/**
 * Create a scene graph node, filling with everything from info but using the
 * following defaults if they are not provided:
 *    'position': [0, 0, 0],
 *    'rotation': [0, 0, 0],
 *    'scale': [1, 1, 1],
 *    'origin': [0, 0, 0],
 *    'transform': mat4.create(),
 *    'temp': mat4.create(),
 *    'color': [0, 0, 0, 1],
 *    'start': 0,
 *    'count': 0,
 *    'children': [],
 * @param {object} info 
 * @returns {object} the created node
 */
function createNode(info) {
    return Object.assign({
        // Transformation information
        // Only the 'transform' matrix is used during rendering
        // It must be updated with updateTransformation() whenever any of the
        // other values are updated so the new values get used
        'position': [0, 0, 0],
        'rotation': [0, 0, 0],
        'scale': [1, 1, 1],
        'origin': [0, 0, 0],
        'transform': mat4.create(),

        // Temporary matrix - used during rendering
        // NOTE: could use the Object Pool Design Pattern instead
        // https://egghead.io/blog/object-pool-design-pattern 
        // That site even mentions game engines as a place to use it
        'temp': mat4.create(),

        // Optional - fixed color information
        'color': [0, 0, 0, 1],

        // Drawing information
        'mode': 4, // == gl.TRIANGLES (but the gl variable isn't available)
        'start': 0,
        'count': 0,

        // Children of this node in the scene graph
        'children': [],
    }, info);
}

/**
 * Copies a scene graph node. Everything except for 'children' is copied.
 * If addl_info is provided, it overrides any copied or default values.
 * @param {object} node
 * @param {object} addl_info
 * @returns {object} the new copy of the node
 */
function copyNode(node, addl_info = {}) {
    return Object.assign(structuredClone(node), {'children': []}, addl_info);
}

/**
 * Setup a listener for one of the scene nodes to change with one of the sliders.
 * Also updates the current transformation matrix.
 * @param {object} node the node in the scene graph
 * @param {string} id the HTML slider id
 * @param {number} angle 0, 1, or 2 for which angle the slider updates
 */


function setupListener(node, angle, value) {
    node.rotation[angle] = value;
    updateTransformation(node);
}

function walk() {
    let left_leg = gl.scene.children[1]
    left_leg.rotation[0] = left_leg.rotation[0]*-1
    updateTransformation(left_leg);
    let right_leg = gl.scene.children[2]
    right_leg.rotation[0] = right_leg.rotation[0]*-1
    updateTransformation(right_leg);
    let right_arm = gl.scene.children[4]
    right_arm.rotation[2] = 0
    updateTransformation(right_arm)
    render()
    
}

function wave() {
    let right_arm = gl.scene.children[4]
    right_arm.rotation[2] = 170 - 5*Math.sin(gl.time_factor*10)
    updateTransformation(right_arm)
}

/**
 * Update the transformation value in a node based on the 'rotation',
 * 'position', 'scale', and 'origin' keys.
 */
function updateTransformation(node) {
    mat4.fromRotationTranslationScaleOrigin(node.transform,
        quat.fromEuler(quat.create(), ...node.rotation),
        node.position,
        node.scale,
        node.origin
    )
}

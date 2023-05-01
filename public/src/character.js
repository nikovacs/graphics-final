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
    let start_pos = [4.1855, -0.574, -1.51]

    // Create drawables to use for all parts
    // Note: cube() takes a list of width, height, and depth
    // Note: cylinder() takes two args: height and diameter
    let vertices = [], normals = [], indices = [];
    let [torso_start, torso_count] = cube(vertices, normals, indices, [0.2, 0.35, 0.2]);
    let [neck_start, neck_count] = cube(vertices, normals, indices, [0.05, 0.02, 0.05]);
    let [head_start, head_count] = cylinder(vertices, normals, indices, 0.16, 0.16);
    let [leg_start, leg_count] = cube(vertices, normals, indices, [0.09, 0.2, 0.1]);
    let [arm_start, arm_count] = cube(vertices, normals, indices, [0.06, 0.30, 0.1]);
    let [eye_start, eye_count] = cube(vertices, normals, indices, [0.05, 0.025, 0.03]);
    let [mouth_start, mouth_count] = cube(vertices, normals, indices, [0.10, 0.015, 0.03]);


    // Create the VAO
    let vao = createVAO(gl, gl.program, {
        "aPosition": [vertices, 3],
        "aNormal": [normals, 3],
    }, indices);

    // Create the scene graph of all of the body parts

    let left_arm = createNode({
        'id':'larm',
        'color': skin,
        'start': arm_start,
        'origin': [0, 0.25/2, 0],
        'count': arm_count,
        'position': [-.12, .025, 0],
        'rotation' :[0,0,0]

    });
    updateTransformation(left_arm)
    let right_arm = copyNode(left_arm, {'position': [.12, .025, 0], 'id':'rarm'});
    updateTransformation(right_arm)


    let left_leg = createNode({
        'id':'lleg',
        'color': jeans,
        'start': leg_start,
        'origin': [0, -0.35/2, 0],
        'count': leg_count,
        'position': [-.06, -0.55/2, 0],
        'rotation' :[5,0,0]

    });
    updateTransformation(left_leg);
    let right_leg = copyNode(left_leg, {'position': [.06, -0.55/2, 0], 'id':'rleg','rotation':[-5,0,0]});
    updateTransformation(right_leg)
    let torso = createNode({
        'id':'torso',
        'position': [0, -0.075, 0],
        'color': shirt,
        'start': torso_start,
        'count': torso_count,
        'children': [left_leg, right_leg, left_arm, right_arm],
        'rotation' :[0,1,0]

    });
    updateTransformation(torso)

    let neck = createNode({
        'id':'neck',
        'position': [0, -0.35/2, 0],
        'color': skin,
        'start': neck_start,
        'count': neck_count,
        'children': [torso],
        'rotation' :[0,1,0]

    });
    updateTransformation(neck)

    let left_eye = createNode({
        'id': 'l-eye', 
        'position': [0.03, 0.04, -0.07],
        'color': black,
        'start': eye_start,
        'count': eye_count,
        'rotation' :[0,0,0]
    });
    updateTransformation(left_eye)
    let right_eye = copyNode(left_eye, {'position': [-0.03, 0.04, -.07], 'id':'r-eye'});
    updateTransformation(right_eye)

    let mouth = createNode({
        'id': 'mouth', 
        'position': [0, -0.02, -0.07],
        'color': black,
        'start': mouth_start,
        'count': mouth_count,
        'rotation' :[0,0,0]
    });
    updateTransformation(mouth)

    let head = createNode({
        'id': 'head', 
        'position': [0.01, 0.09, 0],
        'color': skin,
        'start': head_start,
        'count': head_count,
        "children": [neck, left_eye, right_eye, mouth],
        'rotation' :[0,0,0]
    });
    updateTransformation(head)



    // Return the information
    return [vao, head];
}

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
    // console.log(node.temp[12], node.temp[13], node.temp[14])

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

    self.animation = "walk"
    let left_leg = gl.characterNode.children[0].children[0].children[0]
    left_leg.rotation[0] = left_leg.rotation[0]*-1
    updateTransformation(left_leg);
    let right_leg = gl.characterNode.children[0].children[0].children[1]
    right_leg.rotation[0] = right_leg.rotation[0]*-1
    updateTransformation(right_leg);
}

function wave() {
    let right_arm = gl.characterNode.children[0].children[0].children[3]
    right_arm.rotation[2] = 170 - 5*Math.sin(gl.time_factor*10)
    updateTransformation(right_arm)

}
function lowerhand() {
    let right_arm = gl.characterNode.children[0].children[0].children[3]
    right_arm.rotation[2] = 0
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


// function start_player(character, position){
//     for (let child of character.children){
//         for (let i = 0; i < child.position.length; i++){
//             console.log(i)
//             character.position[i]=position[i]
//             child.position[i]= position[i]
//         }
//         updateTransformation(character)
//         updateTransformation(child)

//     }

// }
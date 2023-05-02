
/**
 * Create all components of the character as a scene graph including the buffers,
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
    let [eye_start, eye_count] = cube(vertices, normals, indices, [0.05, 0.025, 0.03]);
    let [mouth_start, mouth_count] = cube(vertices, normals, indices, [0.10, 0.015, 0.03]);


    // Create the VAO
    let vao = createVAO(gl, gl.program, {
        "aPosition": [vertices, 3],
        "aNormal": [normals, 3],
    }, indices);

    // Create the scene graph of all of the body parts for the character

    let left_arm = createNode({
        'id':'l-arm',
        'color': skin,
        'start': arm_start,
        'origin': [0, 0.25/2, 0],
        'count': arm_count,
        'position': [-.12, .025, 0],
        'rotation' :[0,0,0]

    });
    updateTransformation(left_arm)
    let right_arm = copyNode(left_arm, {'position': [.12, .025, 0], 'id':'r-arm'});
    updateTransformation(right_arm)


    let left_leg = createNode({
        'id':'l-leg',
        'color': jeans,
        'start': leg_start,
        'origin': [0, 0.35/2, 0],
        'count': leg_count,
        'position': [-.06, -0.55/2, 0],
        'rotation' :[0,0,0]

    });
    updateTransformation(left_leg);
    let right_leg = copyNode(left_leg, {'position': [.06, -0.55/2, 0], 'id':'r-leg','rotation':[0,0,0]});
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
        'position': [0.01, -0.06, 0],
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

function renderCharacters() {
    for (const id in players) {
        if (players[id].animation === "walk") {
            walk();
        } else if (players[id].animation === "wave") {
            wave();
        } else if (players[id].animation === "idle") {
            resetArm();
            resetLegs();
        }
        // draw a player
        renderCharacter(gl.characterNode, mat4.fromRotationTranslationScale(
            mat4.create(),
            quat.fromEuler(quat.create(), 0, -players[id].rot[1], 0),
            vec3.negate(_temps[0], players[id].pos),
            vec3.fromValues(0.0375, 0.0375, 0.0375)
        ))
    }

    // draw self
    if (!firstPerson) {
        if (self.animation === "walk") {
            walk();
            resetArm();
        } else if (self.animation === "wave") {
            wave();
            resetLegs();
        } else if (self.animation === "idle") {
            resetArm();
            resetLegs();
        }
        renderCharacter(gl.characterNode, mat4.fromRotationTranslationScale(
            mat4.create(),
            quat.fromEuler(quat.create(), 0, -self.rot[1], 0),
            vec3.negate(_temps[0], self.pos),
            vec3.fromValues(0.0375, 0.0375, 0.0375)
        ))
    }
}

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
 * Walking animation for legs. 
 * Called by movement in any direction
 * Listeners for W, A, S, D will trigger this function
 * Sets l-leg and r-leg rotations to be inverted 
 */
function walk() {
    let left_leg = gl.characterNode.children[0].children[0].children[0]
    let right_leg = gl.characterNode.children[0].children[0].children[1]
    left_leg.rotation[0] = Math.sin(gl.time_factor) * 45
    right_leg.rotation[0] = Math.sin(gl.time_factor) * -45
    updateTransformation(left_leg);
    updateTransformation(right_leg);
}

/**
 * Resets l-leg and r-leg rotations to 0 when player is idle.  
 */
function resetLegs() {
    let left_leg = gl.characterNode.children[0].children[0].children[0]
    if (left_leg.rotation[0] !== 0) {
        left_leg.rotation[0] = 0
        updateTransformation(left_leg);
    }
    let right_leg = gl.characterNode.children[0].children[0].children[1]
    if (right_leg.rotation[0] !== 0) {
        right_leg.rotation[0] = 0
        updateTransformation(right_leg);
    }
}

/**
 * Waving animation for r-arm
 * Sets the right arm rotation to a value based on time factor
 */
function wave() {
    let right_arm = gl.characterNode.children[0].children[0].children[3]
    right_arm.rotation[2] = 170 - 5*Math.sin(gl.time_factor*10)
    updateTransformation(right_arm)
}

/**
 * Resets r-arm rotation to 0 when player is idle
 */
function resetArm() {
    let right_arm = gl.characterNode.children[0].children[0].children[3]
    if (right_arm.rotation[2] === 0) { return; }
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
let currentListeners = [];
let zoom = 1;
function setDefaultListeners() {
    // Set the default listeners for movement
    gl.canvas.addEventListener('keydown', defaultMovement);
    currentListeners.push(['keydown', defaultMovement]);

    // change x and y rotation based on mouse movement
    gl.canvas.addEventListener('mousemove', defaultMouseMovement);
    currentListeners.push(['mousemove', defaultMouseMovement]);
}

function defaultMovement(e) {
    // movement keys
    switch (e.key) {
    case 'w':
        // move forward
        break;
    case 'a':
        // move left
        break;
    case 's':
        // move backward
        break;
    case 'd':
        // move right
        break;
    }
}

function defaultMouseMovement(e) {
    let x = e.movementX;
    let y = e.movementY;

    // change x and y rotation based on mouse movement
    // TODO
    // zoom += y / 100;
    // if (zoom < 0.1) {
    //     zoom = 0.1;
    // }
    // if (zoom > 15) {
    //     zoom = 15;
    // }
    // let mv = mat4.create()
    // mat4.rotateX(mv, mv, Math.PI / 2);
    // mat4.translate(mv, mv, [5, -zoom, 0]);
    // gl.uniformMatrix4fv(gl.program.uModelViewMatrix, false, mv);

}

/**
 * Clears all listeners that are currently on the player
 */
function clearListeners() {
    for (let [event, func] of currentListeners) {
        gl.canvas.removeEventListener(event, func);
    }
}
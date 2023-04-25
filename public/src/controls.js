let currentListeners = [];

function setDefaultListeners() {
    // Set the default listeners for movement
    window.addEventListener('keydown', defaultMovement);
    currentListeners.push(['keydown', defaultMovement]);

    // change x and y rotation based on mouse movement
    // gl.canvas.addEventListener('mousemove', defaultMouseMovement);
    // currentListeners.push(['mousemove', defaultMouseMovement]);
}

function defaultMovement(e) {
    let directionVector = [0, 0, 0]
    // movement keys
    switch (e.key) {
    case 'w':
        // move forward
        directionVector[2] = 0.05;
        break;
    case 'a':
        // move left
        self.rot[1] -= 5;
        break;
    case 's':
        // move backward
        directionVector[2] = -0.05;
        break;
    case 'd':
        // move right
        self.rot[1] += 5;
        break;
    case " ":
        // move up
        self.pos[1] -= 0.05;
        break;
    case "Shift":
        // move down
        self.pos[1] += 0.05;
        break;

    }
    updateModelViewMatrix(directionVector);
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
let currentListeners = [];

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

}

/**
 * Clears all listeners that are currently on the player
 */
function clearListeners() {
    for (let [event, func] of currentListeners) {
        gl.canvas.removeEventListener(event, func);
    }
}
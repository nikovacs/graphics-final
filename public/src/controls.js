// let currentListeners = [];
const pressedKeys = new Set();

function setDefaultListeners() {
    // Set the default listeners for movement
    function monitorKeydown(e) {
        pressedKeys.add(e.key);
        if (pressedKeys.has('e')) {
            wave()
        }
    }
    function monitorKeyup(e) {
        pressedKeys.delete(e.key);
    }
    window.addEventListener('keydown', monitorKeydown);
    // currentListeners.push(['keydown', monitorKeydown]);

    window.addEventListener('keyup', monitorKeyup);
    // currentListeners.push(['keyup', monitorKeyup]);

    // change x and y rotation based on mouse movement
    document.addEventListener('mousemove', defaultMouseMovement);
    // currentListeners.push(['mousemove', defaultMouseMovement]);

    document.addEventListener('click', function () {
        document.body.requestPointerLock();
    });
}

function animation() {
    if (pressedKeys.has('e')) {
        wave();
    }


}
function doMovement() {
    const MOVEMENTSPEED = 0.0025;
    const directionVector = [0, 0, 0];
    if (pressedKeys.has('w')) {
        // move forward
        directionVector[2] = MOVEMENTSPEED;
        walk()
        lowerhand()
    } 
    if (pressedKeys.has('s')) {
        // move backward
        directionVector[2] = -MOVEMENTSPEED;
        walk()
        lowerhand()
    } 
    if (pressedKeys.has('a')) {
        // move left
        directionVector[0] = MOVEMENTSPEED;
    } 
    if (pressedKeys.has('d')) {
        // move right
        directionVector[0] = -MOVEMENTSPEED;
    }
    
    updateViewMatrix(directionVector);
    

    // call again in 15ms
    setTimeout(() => this.doMovement(), 15);
}

function defaultMouseMovement(e) {
    const sensitivity = 0.05;
    let x = e.movementX;
    let y = e.movementY;

    self.rot[1] += x * sensitivity;
    self.rot[0] += y * sensitivity;

    // updateModelViewMatrix();

}

/**
 * Clears all listeners that are currently on the player
 */
// function clearListeners() {
//     for (let [event, func] of currentListeners) {
//         gl.canvas.removeEventListener(event, func);
//     }
//     currentListeners = [];
// }

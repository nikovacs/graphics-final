let currentListeners = [];
const chatLogs = [];
const pressedKeys = new Set();

function setDefaultListeners() {
    // Set the default listeners for movement
    window.addEventListener('keydown', monitorKeydown);
    currentListeners.push([window, 'keydown', monitorKeydown]);

    window.addEventListener('keyup', monitorKeyup);
    currentListeners.push([window, 'keyup', monitorKeyup]);

    // change x and y rotation based on mouse movement
    document.addEventListener('mousemove', defaultMouseMovement);
    currentListeners.push([document, 'mousemove', defaultMouseMovement]);

    document.addEventListener('click', doPointerLock);
    currentListeners.push([document, 'click', doPointerLock]);

    window.addEventListener("keydown", defaultOnKeydown);
    currentListeners.push([window, 'keydown', defaultOnKeydown]);

    window.addEventListener("keydown", chatBarListener);
}

function chatBarListener(e) {
    function closeChatbar() {
        chatbox.style.display = "none";
        setDefaultListeners();
    }

    function openChatbar() {
        chatbox.value = "";
        chatbox.style.display = "block";
        chatbox.focus();
    }

    if (e.key === 'Tab') {
        e.preventDefault();
        clearListeners();
        let chatbox = document.getElementById("chatbox")
        if (chatbox.style.display === "block") {
            closeChatbar();
        } else {
            chatbox.addEventListener("keydown", function chatboxReturnListener(e1) {
                if (e1.key === 'Enter') {
                    e.preventDefault();
                    chatbox.removeEventListener("keydown", chatboxReturnListener);
                    closeChatbar();
                    setDefaultListeners();
                    if (chatbox.value.trim() !== "") {
                        chatLogs.push(chatbox.value.trim());
                    }
                    if (chatLogs.length > 18) {
                        chatLogs.shift();
                    }
                }
            });
            openChatbar();
        }
    }
}

function monitorKeydown(e) {
    pressedKeys.add(e.key);
}

function monitorKeyup(e) {
    pressedKeys.delete(e.key);
}

function doPointerLock() {
    document.body.requestPointerLock();
}

function defaultOnKeydown(e) {
    switch (e.key) {
    case 't':
    case 'T':
        firstPerson = !firstPerson;
        break;
    }
}

function doMovement() {
    const MOVEMENTSPEED = 0.0025;
    const directionVector = [0, 0, 0];
    if (pressedKeys.has('w')) {
        // move forward
        directionVector[2] = MOVEMENTSPEED;
    } 
    if (pressedKeys.has('s')) {
        // move backward
        directionVector[2] = -MOVEMENTSPEED;
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

    if (directionVector.some((x) => x !== 0)) {
        self.animation = "walk";
    } else if (pressedKeys.has('e')) {
        self.animation = "wave";
        setTimeout(() => self.animation = "idle", 2000);
    } else if (self.animation === "walk") {
        self.animation = "idle";
    }    

    // call again in 15ms
    setTimeout(() => this.doMovement(), 15);
}

function defaultMouseMovement(e) {
    const sensitivity = 0.05;
    let x = e.movementX;
    let y = e.movementY;

    self.rot[1] += x * sensitivity;
    self.rot[0] += y * sensitivity;
}

/**
 * Clears all listeners that are currently on the player
 */
function clearListeners() {
    for (let [obj, event, func] of currentListeners) {
        obj.removeEventListener(event, func);
    }
    currentListeners = [];
}

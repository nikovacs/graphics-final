// Array holding arrays of [object, event, function] for all listeners
let currentListeners = [];

// set to contain all keys that are currently held down
const pressedKeys = new Set();

// the maximum number of chats that can exist in the chat logs
const MAXCHATLENGTH = 18;
const chatLogs = [];

/**
 * Sets the default listeners for the player
 * These are important for things such as movement
 * and mosue controls
 */
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
    window.addEventListener("keydown", toggleGUI);
}

/**
 * This keydown listener is always active and
 * is used to toggle GUI controls and Chat being visible
 * @param {event} e 
 */
function toggleGUI(e) {
    if (e.key === 'c' & document.getElementById("chatbox").style.display !== "block") {
        clearListeners();
        for (let element of ["chatlog", "cursor-controls-overlay", "keyboard-controls-overlay"]) {
            if (document.getElementById(element).style.display === "none") {
                document.getElementById(element).style.display = "block"
            } else{
                document.getElementById(element).style.display = "none"
            }
            setDefaultListeners();
        }
    }
}
        

/**
 * This keydown listener is always active and
 * is used to open and close the chatbar
 * @param {event} e 
 */
function chatBarListener(e) {
    let chatbox = document.getElementById("chatbox")
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
                        addChat(chatbox.value.trim());
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

/**
 * Adds a key to the set of keys
 * when a new one is pressed
 * @param {event} e
*/
function monitorKeydown(e) {
    pressedKeys.add(e.key.toLowerCase());
}

/**
 * Removes a key from the set of keys
 * @param {event} e 
 */
function monitorKeyup(e) {
    pressedKeys.delete(e.key.toLowerCase());
}

/**
 * This function is called when the mouse is clicked
 * and it locks the pointer to the screen
 */
function doPointerLock() {
    document.body.requestPointerLock();
}

/**
 * Default functionality for keydown events
 * @param {event} e 
 */
function defaultOnKeydown(e) {
    switch (e.key.toLowerCase()) {
    case 't':
        firstPerson = !firstPerson;
        break;
    case 'e':
        self.animation = "wave";
        setTimeout(() => self.animation = "idle", 2000);
        break;
    }
}

/**
 * Recursive function that updates the view matrix
 * based on keyboard inputs
 */
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

    // set an appropriate animation
    if (directionVector.some((x) => x !== 0)) {
        self.animation = "walk";
    } else if (self.animation === "walk") {
        self.animation = "idle";
    }

    // call again in 15ms
    setTimeout(() => this.doMovement(), 15);
}

/**
 * The default event function for using the
 * mouse to change the camera's position
 * @param {event} e 
 */
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
    pressedKeys.clear();
}

/**
 * This function is called when a new chat appears,
 * either from the player or other players
 * @param {string} txt 
 */
function addChat(txt, isSelf = true) {
    if (chatLogs.length !== 0 && chatLogs[chatLogs.length - 1].endsWith(txt.trim())) {
        return;
    }
    chatLogs.push(new Date().toLocaleTimeString() + ": " + txt);
    if (chatLogs.length > MAXCHATLENGTH) {
        chatLogs.shift();
    }
    document.getElementById("chatlog").value = [...chatLogs].reverse().join("\n")
    if (isSelf) {
        broadcastChat(txt);
    }
}

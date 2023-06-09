const socket = io();

// store other players
let players = {};

socket.on("spawnPlayer", (msg) => {
    players[msg.id] = {
        pos: msg.pos,
        rot: msg.rot,
        animation: msg.animation
    };
});

socket.on("despawnPlayer", (id) => {
    delete players[id];
});

socket.on("updateChat", (msg) => {
    addChat(msg, false);
});

socket.on("updatePlayerPosition", (msg) => {
    players[msg.id].pos = msg.pos
});

socket.on("updatePlayerRotation", (msg) => {
    players[msg.id].rot = msg.rot
});

socket.on("updatePlayerAnimation", (msg) => {
    players[msg.id].animation = msg.animation;
});

// interval 20 times a second
// inefficient as it updates when unnecessary
setInterval(() => {
    socket.emit("updatePlayerPosition", self.pos);
    socket.emit("updatePlayerRotation", self.rot);
    socket.emit("updatePlayerAnimation", self.animation);
}, 50);

/** 
 * This function takes a string and broadcasts it to all other sockets
 * @param {string} txt 
 */
function broadcastChat(txt) {
    socket.emit("updateChat", txt);
}



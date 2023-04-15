const socket = io();

// store other players
let players = {};

socket.on('connect', function () {
    console.log('Connected to server');
});

socket.on("spawnPlayer", (msg) => {
    console.log(`Spawning player ${msg.id}`)
    players[msg.id] = {
        x: msg.x,
        y: msg.y,
        y_rot: msg.y_rot,
        animation: msg.animation
    };
});

socket.on("despawnPlayer", (id) => {
    console.log(`Despawning player ${id}`)
    delete players[id];
});

socket.on("updatePlayerPosition", (msg) => {
    console.log(`Updating player ${msg.id}`)
    players[id].x = msg.x;
    players[id].y = msg.y;
});

socket.on("updatePlayerRotation", (msg) => {
    console.log(`Updating player ${msg.id}`)
    players[id].y_rot = msg.y_rot;
});

socket.on("updatePlayerAnimation", (msg) => {
    console.log(`Updating player ${msg.id}`)
    players[id].animation = msg.animation;
});



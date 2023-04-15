let socket = io();

// store other players
let players = {};

socket.on('connect', function (socket) {
    console.log('Connected to server');
});

socket.on("spawnPlayer", (id, x, y) => {
    players[id] = {
        x: x,
        y: y
    };
});

socket.on("despawnPlayer", (id) => {
    delete players[id];
});

socket.on("updatePlayerPosition", (id, x, y) => {
    players[id].x = x;
    players[id].y = y;
});

socket.on("updatePlayerRotation", (id, y_rot) => {
    players[id].y_rot = y_rot;
});

socket.on("updatePlayerAnimation", (id, animation) => {
    players[id].animation = animation;
});



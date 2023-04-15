let socket = io();

// store other players
let players = {};

socket.on('connect', function () {
    console.log('Connected to server');
});

socket.on("spawnPlayer", (id, x, y) => {
    console.log(`Spawning player ${id} at (${x}, ${y})`)
    players[id] = {
        x: x,
        y: y
    };
});

socket.on("despawnPlayer", (id) => {
    console.log(`Despawning player ${id}`)
    delete players[id];
});

socket.on("updatePlayerPosition", (id, x, y) => {
    console.log(`Updating player ${id} position to (${x}, ${y})`)
    players[id].x = x;
    players[id].y = y;
});

socket.on("updatePlayerRotation", (id, y_rot) => {
    console.log(`Updating player ${id} rotation to ${y_rot}`)
    players[id].y_rot = y_rot;
});

socket.on("updatePlayerAnimation", (id, animation) => {
    console.log(`Updating player ${id} animation to ${animation}`)
    players[id].animation = animation;
});



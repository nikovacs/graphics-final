const express = require('express');
const path = require('path');
const socketIO = require('socket.io');
const http = require('http');

const publicPath = path.join(__dirname, '..', 'public');
const port = process.env.PORT || 3000;

const app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));

players = {};

io.on("connection", (socket) => {
    console.log(`A new user just connected: ${socket.id}`);
    onPlayerLogin(socket);

    socket.on("disconnect", () => {
        console.log(`User was disconnected: ${socket.id}`);
        onPlayerLogout(socket);
    });

    socket.on("updatePlayerPosition", (x, y) => {
        players[socket.id].x = x;
        players[socket.id].y = y;
        socket.broadcast.emit("updatePlayerPosition", {
            id: socket.id,
            x: x,
            y: y,
        });
    });

    socket.on("updatePlayerRotation", (y_rot) => {
        players[socket.id].y_rot = y_rot;
        socket.broadcast.emit("updatePlayerRotation", {
            id: socket.id,
            y_rot: y_rot
        });
    });

    socket.on("updatePlayerAnimation", (animation) => {
        players[socket.id].animation = animation;
        socket.broadcast.emit("updatePlayerAnimation", {
            id: socket.id,
            animation: animation // str
        });
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})

function onPlayerLogin(socket) {
    players[socket.id] = {
        x: 0,
        y: 0,
        socket: socket,
        y_rot: 0,
        animation: "idle"
    };
    socket.broadcast.emit("spawnPlayer", {
        id: socket.id,
        x: 0,
        y: 0,
        y_rot: 0,
        animation: "idle"
    });
    // spawn exisitng players for the new player
    // iterate over players
    for (let id in players) {
        if (id !== socket.id) {
            socket.emit("spawnPlayer", {
                id: id,
                x: players[id].x,
                y: players[id].y,
                y_rot: players[id].y_rot,
                animation: players[id].animation
            });
        }
    }
}

function onPlayerLogout(socket) {
    socket.broadcast.emit("despawnPlayer", socket.id);
    delete players[socket.id];
}


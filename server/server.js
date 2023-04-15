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
        io.emit("updatePlayerPosition", {
            id: socket.id,
            x: x,
            y: y,
        });
    });

    socket.on("updatePlayerRotation", (y_rot) => {
        players[socket.id].y_rot = y_rot;
        io.emit("updatePlayerRotation", {
            id: socket.id,
            y_rot: y_rot
        });
    });

    socket.on("updatePlayerAnimation", (animation) => {
        players[socket.id].animation = animation;
        io.emit("updatePlayerAnimation", {
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
    io.emit("spawnPlayer", {
        id: socket.id,
        x: 0,
        y: 0,
        y_rot: 0,
        animation: "idle"
    });
}

function onPlayerLogout(socket) {
    io.emit("despawnPlayer", socket.id);
    delete players[socket.id];
}


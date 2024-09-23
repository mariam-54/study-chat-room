const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const cors = require('cors');
app.use(cors({
  origin: 'https://fastidious-liger-888410.netlify.app', 
}));

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Store users in rooms 
const users = {}; 

// Run when client connects
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle user joining a room
  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    users[socket.id] = { username, room };

    // Welcome message to the new user
    socket.emit("message", {
      username: "Admin",
      text: "Welcome to study chat!",
      time: new Date().toLocaleTimeString(),
    });

    // Broadcast when a new user joins
    socket.broadcast.to(room).emit("message", {
      username: "Admin",
      text: `${username} has joined the chat.`,
      time: new Date().toLocaleTimeString(),
    });

    // Send room and users to the client
    io.to(room).emit("roomUsers", {
      room,
      users: Object.values(users).filter((user) => user.room === room),
    });
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit("message", {
        username: "Admin",
        text: `${user.username} has left the chat.`,
        time: new Date().toLocaleTimeString(),
      });
      delete users[socket.id]; // Remove user from the list
    }
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    io.to(msg.room).emit("message", {
      username: msg.username,
      text: msg.text,
      time: new Date().toLocaleTimeString(),
    });
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

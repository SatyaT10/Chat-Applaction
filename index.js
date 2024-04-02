const app = require('express')();
const http = require('http').Server(app);
require('dotenv').config();
const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1:27017/chatApp');
const userRoute = require('./routes/userRoute');
const User = require('./models/userModel');
const Chat = require('./models/chatModel');

app.use('/', userRoute);
const io = require('socket.io')(http);

var usp = io.of('/user',);

usp.on('connection', async function (socket) {
    console.log('User Connected!');

    const _id = socket.handshake.auth.token;

    // console.log(_id);
    await User.findOneAndUpdate({ _id: _id }, { $set: { is_online: '1' } });
    //user Online in Real time
    console.log(_id);
    socket.broadcast.emit('getOnlineUser', { user_id: _id });

    socket.on('disconnect', async function () {
        console.log('User Disconnected!');

        const _id = socket.handshake.auth.token;
        // console.log(_id);
        await User.findOneAndUpdate({ _id: _id }, { $set: { is_online: '0' } });
        //user Offline in Real time
        socket.broadcast.emit('getOfflineUser', { user_id: _id });
    });
    //chatting implemantation
    socket.on('newChat', function (data) {
        socket.broadcast.emit('loadNewChat', data);
    });

    //load Old chats
    socket.on('existsChat', async function (data) {
        var chats = await Chat.find({
            $or: [
                {
                    sender_id: data.sender_id, receiver_id: data.receiver_id
                },
                {
                    sender_id: data.receiver_id, receiver_id: data.sender_id
                }
            ]
        });
        socket.emit("showOldMessage", { chats: chats });
    });

    //Chat deleted
    socket.on('chatDeleted', function (id) {
        socket.broadcast.emit('chatMassageDeleted', id);
    });
    // Chata Updated
    socket.on('chatUpdated', function (id) {
        socket.broadcast.emit('chatMassageUpdated', id);
    });

    //group chat  related code start here
    socket.on('newGroupChat', function (data) {
        socket.broadcast.emit('loadNewGroupChat', data);
    });

    socket.on('groupChatDeleted', function (id) {
        socket.broadcast.emit('groupChatMessageDeleted', id);
    });

    socket.on('groupChatUpdated', function (id) {
        socket.broadcast.emit('groupChatMassageUpdated', id);
    });


});

http.listen(8080, () => { console.log("Server is listenig on port 8080.") });
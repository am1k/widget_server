var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

module.exports = {
    app: app,
    http: http,
    io: io
};
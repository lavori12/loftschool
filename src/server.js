let WebSocketServer = new require('ws'),
    clients = {};

const uuidv1 = require('uuid/v1'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    adapter = new FileSync('database/db.json'),
    db = low(adapter);

db.defaults({ users: {}, messages: {} })
    .write();

let webSocketServer = new WebSocketServer.Server({
    port: 8081
});

webSocketServer.on('connection', function (ws) {
    let id = uuidv1();

    let client = {
        user: null,
        connection: ws
    };

    clients[id] = client;
    console.log(' новое соединение ' + id);

    ws.on('message', function (message) {
        const data = JSON.parse(message);

        switch (data.payload) {
            case 'login':
                userLogin(client, data.data);
                break;
            case 'uploadPhoto':
                uploadPhoto(client, data.data);
                break;
            case 'new_message':
                sendMessage(client, data.data);
                break;
        }

    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);

        delete clients[id];
        for (const key in clients) {
            const response = { payload: 'userDisconnect', data: client.user.login };

            clients[key].connection.send(JSON.stringify(response));
        }
        client = null;
    });
});

const userLogin = (client, userInfo) => {


    let user = db.get('users').find({login: userInfo.login}).value();


    if (user) {
        client.user = user;
    } else {
        client.user = {
            login: userInfo.login,
            photo: null
        };

        db.get('users').push({login: client.user.login}).write();
        //db.set(`users.${client.user.login}`, {login: client.user.login}).write();
    }
    client.user.name = userInfo.name;

    let onlineUsers = [];

    for (const key in clients) {
        let response;

        onlineUsers.push(clients[key].user);

        if(clients[key] !== client) {
            response = { payload: 'userConnect', data: client.user };
            if (clients[key].user) {
                clients[key].connection.send(JSON.stringify(response));
            }
        }
    }

    let response = { payload: 'login', data: {onlineUsers: onlineUsers, messages: db.get('messages').value()} };
    client.connection.send(JSON.stringify(response));
};


const sendMessage = (id, message) => {
    for (const key in clients) {
        const response = { payload: 'send_message', data: { user: clients[id], text: message } };

        clients[key].connection.send(JSON.stringify(response));
    }
};

const uploadPhoto = (client, photo) => {
    if (client.user) {
        client.user.photo = photo;
        db.get('users').find({login: client.login}).assign({photo: photo}).write();

        for (const key in clients) {
            let response;

            if(clients[key] !== client) {
                response = { payload: 'updatePhoto', data: { login: client.user.login, photo: client.user.photo } };
                if (clients[key].user) {
                    clients[key].connection.send(JSON.stringify(response));
                }
            }
        }

        let response = { payload: 'uploadPhoto', data: 'ok' };
        client.connection.send(JSON.stringify(response));
    }
};

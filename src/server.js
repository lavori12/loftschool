let WebSocketServer = new require('ws'),
    clients = {};

const uuidv1 = require('uuid/v1'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    adapter = new FileSync('database/db.json'),
    db = low(adapter);

var webSocketServer = new WebSocketServer.Server({
    port: 8081
});

webSocketServer.on('connection', function (ws) {
    let id = uuidv1();

    clients[id] = ws;
    console.log(' новое соединение ' + id);

    ws.on('message', function (message) {
        const data = JSON.parse(message);

        switch (data.payload) {
            case 'new_user':
                addNewUser(data.data);
                break;
            case 'upload_avatar':
                uploading(data.data);
                break;
            case 'new_message':
                sendMessage(data.data);
                break;
        }

    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);

        delete clients[id];
        for (const key in clients) {
            const response = { payload: 'new_user', data: clients };

            clients[key].send(JSON.stringify(response));
        }
    });

    const addNewUser = (userInfo) => {

        clients[id].name = userInfo.name;
        clients[id].login = userInfo.login;
        clients[id].photo = userInfo.photo;

        for (const key in clients) {
            const response = { payload: 'new_user', data: clients };

            clients[key].send(JSON.stringify(response));
        }
    };

    const uploading = (photo) => {
        console.log(photo);
    };

    const sendMessage = (message) => {
        for (const key in clients) {
            const response = { payload: 'send_message', data: { user: clients[id], text: message } };

            clients[key].send(JSON.stringify(response));
        }
    };

/*    function addNewUser(name) {
        const allPhotos = db.get('photos').value();

        clients[id].name = name;
        clients[id].send(JSON.stringify({ payload: 'get_photos', data: allPhotos }));
    }

    function uploading(data) {
        db.get('photos')
            .push({ user: clients[id].name, img: data })
            .write()
    } */
});
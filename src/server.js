const WebSocketServer = new require('ws'),
    uuidv1 = require('uuid/v1'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('database/db.json'),
    db = low(adapter);

/*
* Сущности пользователей:
*   user      - текущий пользователь, который сделал запрос
*   member    - любой онлайн пользователь
*   client    - подключившийся клиент (свяка между соединением и user)
* */

let clients = {}, 
    members = {};

const notifyMembers = (payload, data, excludeClient) => {

    // у одного пользователя, может быть несколько соединений, а данные нужно актуализировать, поэтому пробегаемся по clients, а не по members
    for (const key in clients) {
        if (clients[key] !== excludeClient && clients[key].user) {
            clients[key].connection.send( JSON.stringify({ payload: payload, data: data }) );
        }
    }
};

const userLogin = (client, userInfo) => {
    if (!userInfo) {
        throw new Error('no login data');
    }

    if (!userInfo.login) {
        throw new Error('login is empty');
    }

    if (!userInfo.name) {
        throw new Error('name is empty');
    }

    let membersNotification;

    let user = members[userInfo.login];

    if (user) {
        user.connectionCount++;

        if (user.name != userInfo.name) {
            user.name = userInfo.name;
            db.get(`users.${userInfo.login}`).assign({ name: userInfo.name }).write();

            membersNotification = {
                payload: 'updateName',
                data: {
                    login: userInfo.login,
                    name: userInfo.name
                }
            };
        }
    } else {
        // получаем пользователя и клонируем его, чтобы лишние данные не попали в базу
        user = db.get(`users.${userInfo.login}`).value();

        if (user) {
            db.get(`users.${userInfo.login}`).assign({ name: userInfo.name }).write();
        } else {
            user = {
                login: userInfo.login,
                name: userInfo.name,
                photo: null,
                messages: []
            };

            db.set(`users.${userInfo.login}`, user).write();
        }

        user.connectionCount = 1;
        members[userInfo.login] = user;

        membersNotification = {
            payload: 'newMember',
            data: {
                login: user.login,
                name: user.name,
                photo: user.photo
            }
        };
    }

    client.user = user;

    let users = {}; // пользователи, нужные для отображения списка участников и сообщений
    let membersList = [];

    for (const key in members) {
        const member = members[key];

        membersList.push(member.login);

        const userData = {
            login: member.login,
            name: member.name,
            photo: member.photo
        };

        users[userData.login] = userData;
    }

    let messages = [];

    for (const key in user.messages) {
        const message = db.get('messages').find({id: user.messages[key]}).value();

        if (message) {
            if (!users[message.login]) {
                const user = db.get(`users.${message.login}`).value();
                users[message.login] = {
                    login: user.login,
                    name: user.name,
                    photo: user.photo
                };
            }
            messages.push(message);
        }
    }

    return {
        userResponseData: {
            membersList: membersList,
            users: users,
            messages: messages
        },

        membersNotification: membersNotification
    };
};

const uploadPhoto = (client, photo) => {
    if (!client.user) {
        throw new Error('user is not logged in'); 
    }

    if (!photo) {
        throw new Error('no photo'); 
    }

    client.user.photo = photo;

    db.get(`users.${client.user.login}`).assign({ photo: photo }).write();

    return {
        userResponseData: 'ok',
        membersNotification: {
            payload: 'updatePhoto',
            data: {
                login: client.user.login,
                photo: client.user.photo
            }
        }
    };
};

const sendMessage = (client, message) => {
    if (!client.user) {
        throw new Error('user is not logged in'); 
    }

    if (!message) {
        throw new Error('no message'); 
    }

    const messageData = {
        id: db.get('messages').itemCount().value(),
        login: client.user.login,
        timestamp: Date.now(),
        message: message
    };

    db.get('messages').push(messageData).write();

    // запоминаем сообщения, чтоб отобразить их при выходе
    for (const key in members) {
        db.get(`users.${key}`).get('messages').push(messageData.id).write();
    }

    return {
        userResponseData: { id: messageData.id, timestamp: messageData.timestamp },
        membersNotification: {
            payload: 'newMessage',
            data: messageData
        }
    };
};

db._.mixin({
    itemCount: function(array) {
        return array.length;
    }
});

db.defaults({ users: {}, messages: [] })
    .write();

let webSocketServer = new WebSocketServer.Server({
    port: 8081
});

webSocketServer.on('connection', function (connection) {
    let id = uuidv1();

    let client = {
        user: null,
        connection: connection
    };

    clients[id] = client;
    console.log(' новое соединение ' + id);

    connection.on('message', function (message) {
        let payload;

        try {
            const data = JSON.parse(message);

            // чтобы можно было отправить метод в ошибке
            payload = data.payload;

            let result;

            switch (payload) {
            case 'login':
                result = userLogin(client, data.data);
                break;
            case 'uploadPhoto':
                result = uploadPhoto(client, data.data);
                break;
            case 'sendMessage':
                result = sendMessage(client, data.data);
                break;
            default:
                throw new Error('Unknown method');
            }

            if (result) {

                if (result.userResponseData) {
                    connection.send( JSON.stringify({ payload: payload, data: result.userResponseData }) ); 
                }

                if (result.membersNotification) {
                    notifyMembers(result.membersNotification.payload, result.membersNotification.data, client); 
                }

            }
        } catch (error) {
            connection.send( JSON.stringify({ payload: payload, error: error.message }) );
        }

    });

    connection.on('close', function () {
        console.log('соединение закрыто ' + id + ' :: ' + (client.user ? client.user.login: ''));

        delete clients[id];

        if (client.user) {
            client.user.connectionCount--;

            if (client.user.connectionCount == 0) {
                delete members[client.user.login];

                notifyMembers('memberLeft', client.user.login);
            }
        }

        client = null;
    });
});
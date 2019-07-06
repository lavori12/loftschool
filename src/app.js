const authWindow = document.getElementById('authWindow'),
    loginButton = document.getElementById('loginButton'),
    uploadButton = document.getElementById('uploadButton'),
    cancelButton = document.getElementById('cancelButton'),
    fileElem = document.getElementById('fileElem'),
    allMembers = document.getElementById('members'),
    counter = document.getElementById('counter'),
    avatar = document.getElementById('avatar'),
    textMessage = document.getElementById('textMessage'),
    sendButton = document.getElementById('sendButton'),
    messageContainer = document.getElementById('messagesContainer'),
    userNameInput = document.getElementById('userNameInput'),
    userLoginInput = document.getElementById('userLoginInput'),
    userPhoto = document.getElementById('userPhoto'),
    userName = document.getElementById('userName'),
    welcome = document.getElementById('welcome'),
    userInfo = document.getElementById('userInfo'),
    fakeUpload = document.getElementById('fakeUpload'),
    socket = new WebSocket('ws://localhost:8081');

const NO_PHOTO = 'images/NO.jpg';

let fileBase;

let users = {},
    messages = {},
    loginData = {
        name: '',
        login: ''
    },
    onlineCounter = 0;
    
socket.onopen = function () {
    authWindow.style.display = 'block';
};

socket.onclose = function (event) {
    if (event.wasClean) {
        alert('Соединение закрыто чисто');
    } else {
        alert('Обрыв соединения'); // например, "убит" процесс сервера
    }
    alert('Код: ' + event.code + ' причина: ' + event.reason);
};

socket.onmessage = function (event) {
    const res = JSON.parse(event.data);

    switch (res.payload) {
        case 'login':
            onLogin(res.data);
            break;
        case 'userConnect':
            onUserConnect(res.data);
            break;
        case 'userDisconnect':
            onUserDisconnect(res.data);
            break;
        case 'uploadPhoto':
            onUploadPhoto(res.data);
            break;
        case 'updatePhoto':
            onUpdatePhoto(res.data);
            break;
        case 'send_message':
            sendMessage(res.data);
            break;
    }
};

socket.onerror = function (error) {
    alert('Ошибка ' + error.message);
};

loginButton.addEventListener('click', () => {
    loginData.name = userNameInput.value;
    loginData.login = userLoginInput.value;
    const data = JSON.stringify({ payload: 'login', data: loginData });
    socket.send(data);
});

textMessage.addEventListener('keypress', (e) => {
    if (e.keyCode === 13 && textMessage.value !== '') {
        const data = JSON.stringify({ payload: 'new_message', data: textMessage.value });

        textMessage.value = '';
        socket.send(data);
    }
});

sendButton.addEventListener('click', () => {
    if (textMessage.value !== '') {
        const data = JSON.stringify({ payload: 'new_message', data: textMessage.value });

        textMessage.value = '';
        socket.send(data);
    }
});

fileElem.addEventListener('change', () => {


    const file = fileElem.files[0];
    console.log(file);
    let reader = new FileReader();

    reader.onloadend = function (e) {
        const img = e.target.result;
        const container = document.querySelector('.label');
        fakeUpload.style.display = 'none';
        fileBase = img;
        container.style.backgroundImage =  `url('${img}')`;
    };

    reader.readAsDataURL(file);
});

uploadButton.addEventListener('click',  () => {
    if (fileBase) {
        const data = JSON.stringify({ payload: 'uploadPhoto', data: fileBase });

        socket.send(data);
    } else {
        alert('Вы не выбрали фото');
    }
});

cancelButton.addEventListener('click', () => {
    avatar.style.display = 'none';
    document.querySelector('.label').style.backgroundImage = '';
});

const sendMessage = (data) => {
    const newMessage = document.createElement('div'),
        messagePhoto = document.createElement('img'),
        messageName = document.createElement('span'),
        messageText = document.createElement('span');

    if (data.user && data.text) {
        messageName.textContent = data.user.name + '    ';
        messagePhoto.src = data.user.photo;
        messagePhoto.width = 15 +'px';
        messagePhoto.height = 15 +'px';
        messagePhoto.style.borderRadius = '10px';
        messageText.textContent = data.text;
        messageName.style.color = '#ff9966';
        newMessage.appendChild(messageName);
        newMessage.appendChild(messageText);
        messageContainer.appendChild(newMessage);
    }
};

const uploadImg = (data) => {
    document.querySelector('.downloadsPhoto').innerHTML += `<div><img src="${data.data}" /><span>${data.user}</span></div>`;
};

const renderPhoto = (photos = []) => {
    if (photos.length) {
        const container = document.querySelector('.downloadsPhoto');

        photos.forEach(photo => {
            container.innerHTML += `<div><img src="${photo.img}" /><span>${photo.user}</span></div>`
        });
    }
};


const onLogin = (data) => {
    if (data) {
        userName.innerHTML = `<h2>${loginData.name}</h2>`;
        userPhoto.src = NO_PHOTO;
        authWindow.style.display = 'none';
        welcome.style.display = 'none';
        userInfo.style.display = 'block';
        userPhoto.addEventListener('click', () => {
            avatar.style.display = 'block';
            fakeUpload.style.display = '';
        });

        fillUsers(data.onlineUsers);
        //updateMessages();
    }
};

const createUser = (user) => {
    const member = document.createElement('div');

    member.innerHTML = user.name;
    allMembers.appendChild(member);
    users[user.login] = {
        login: user.login,
        name: user.name,
        photo: user.photo || null,
        element: member
    };
    updateOnlineCounter(1);
};

const onUserConnect = (data) => {

    createUser(data);
};

const onUserDisconnect = (login) => {

    allMembers.removeChild(users[login].element);
    delete users[login];
    updateOnlineCounter(-1);
};

const fillUsers = (onlineUsers) => {

    for (const key in onlineUsers) {
        createUser(onlineUsers[key]);
    }
};

const updateOnlineCounter = (add) => {
    onlineCounter+= add;
    counter.textContent = `(${onlineCounter})`;
};

const onUploadPhoto = (status) => {
    if (status === 'ok') {
        userPhoto.src = fileBase;
    }
    updateMessagesPhoto(loginData.login, fileBase);
};

const onUpdatePhoto = (data) => {
    updateMessagesPhoto(data.login, data.photo);
};

const updateMessagesPhoto = (login, photo) => {

};


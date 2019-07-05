const authWindow = document.querySelector('#authWindow'),
    loginButton = document.querySelector('#loginButton'),
    uploadButton = document.querySelector('#uploadButton'),
    cancelButton = document.querySelector('#cancelButton'),
    fileElem = document.querySelector('#fileElem'),
    allMembers = document.querySelector('#members'),
    avatar = document.querySelector('#avatar'),
    textMessage = document.querySelector('#textMessage'),
    sendButton = document.querySelector('#sendButton'),
    messageContainer = document.querySelector('#messagesContainer'),
    socket = new WebSocket('ws://localhost:8081');

let fileBase;

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
        case 'upload_photo':
            uploadImg(res.data);
            break;
        case 'get_photos':
            renderPhoto(res.data);
            break;
        case 'new_user':
            updateMembers(res.data);
            break;
        case 'delete_user':
            updateMembers(res.data);
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
    const userName = document.querySelector('#name').value,
        login = document.querySelector('#login').value,
        userPhoto = document.querySelector('#userPhoto'),
        data = JSON.stringify({ payload: 'new_user', data: { name: userName, login: login, photo: userPhoto } });

    document.querySelector('#user').innerHTML = `<h2>${userName}</h2>`;
    userPhoto.src = 'images/NO.jpg';
    authWindow.style.display = 'none';
    userPhoto.addEventListener('click', () => {
        avatar.style.display = 'block';
    });
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

fileElem.addEventListener('change', function () {
    const fileElem = document.getElementById('fileElem');

    const file = fileElem.files[0];
    let reader = new FileReader();

    reader.onloadend = function (e) {
        const img = e.target.result;
        const container = document.querySelector('.label');

        fileBase = img;
        container.style = `background-image: url('${img}')`;
    };

    reader.readAsDataURL(file);
});

uploadButton.addEventListener('click', function () {
    if (fileBase) {
        const data = JSON.stringify({ payload: 'upload_photo', data: fileBase });

        socket.send(data);
    } else {
        alert('Вы не выбрали фото');
    }
});

cancelButton.addEventListener('click', () => {
    avatar.style.display = 'none';
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

const updateMembers = (members) => {
    const users = document.createElement('div');

    users.innerHTML = '<h2>Участники</h2>';

    for (const key in members) {
        const member = document.createElement('div');

        if (members[key].name) {
            member.innerHTML = members[key].name;
            users.appendChild(member);
        }

    }
    allMembers.innerHTML = '';
    allMembers.appendChild(users);
};
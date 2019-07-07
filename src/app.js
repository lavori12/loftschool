const authPopup = document.getElementById('authPopup'),
    authForm = document.getElementById('authForm'),
    userNameInput = document.getElementById('userNameInput'),
    userLoginInput = document.getElementById('userLoginInput'),
    photoPopup = document.getElementById('photoPopup'),
    uploadPhotoButton = document.getElementById('uploadPhotoButton'),
    cancelPhotoButton = document.getElementById('cancelPhotoButton'),
    fileInput = document.getElementById('fileInput'),
    label = document.getElementById('label'),
    membersContainer = document.getElementById('membersContainer'),
    counterItem = document.getElementById('counter'),
    currentUserNameItem = document.getElementById('currentUserName'),
    currentUserPhotoItem = document.getElementById('currentUserPhoto'),
    welcome = document.getElementById('welcome'),
    userInfoContainer = document.getElementById('userInfoContainer'),
    fakeUploadLabel = document.getElementById('fakeUploadLabel'),
    messageContainer = document.getElementById('messagesContainer'),
    messageInput = document.getElementById('messageInput'),
    messageForm = document.getElementById('messageForm'),
    socket = new WebSocket('ws://localhost:8081');

const NO_PHOTO = 'images/NO.jpg';

let fileBase, currentMessage;

let users = {},
    membersList = [],
    currentLogin = '',
    currentUser = null;

/*
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
*/


const createMemberItem = (user) => {
    if (!user) return;

    const item = document.createElement('div');
    item.innerHTML = user.name;
    membersContainer.appendChild(item);

    user.memberItem = item;

    return item;
};

const createMessageItem = (user, timestamp, text) => {
    if (!user) return;

    const item = document.createElement('div');
    item.className = 'message';

    if (user == currentUser)
        item.classList.add('userMessage');

    const photoItem = document.createElement('img');
    photoItem.className = 'messagePhoto';
    photoItem.src = user.photo || NO_PHOTO;

    const dataContainer = document.createElement('div');
    dataContainer.className = 'messageDataContainer';

    const metaContainer = document.createElement('div');
    metaContainer.className = 'messageMetaContainer';

    const nameItem = document.createElement('div');
    nameItem.className = 'messageName';
    nameItem.innerHTML = user.name;

    const dateItem = document.createElement('div');
    const date = new Date(timestamp);
    let day, month, hours, minutes;
    day = date.getDate().toString();
    if (day.length < 2) {
        day = '0' + day;
    }
    month = (date.getMonth() +1).toString();
    if (month.length < 2) {
        month = '0' + month;
    }
    minutes = date.getMinutes().toString();
    if (minutes.length < 2) {
        minutes = '0' + minutes;
    }
    hours = date.getHours().toString();
    if (hours.length < 2) {
        hours = '0' + hours;
    }
    dateItem.className = 'messageDate';
    dateItem.innerHTML =  hours + ':' + minutes  + ' ' + day + '.' + month;

    const textItem = document.createElement('div');
    textItem.className = 'messageText';
    textItem.innerHTML = text;


    item.appendChild(photoItem);
    item.appendChild(dataContainer);

    dataContainer.appendChild(metaContainer);
    dataContainer.appendChild(textItem);

    metaContainer.appendChild(nameItem);
    metaContainer.appendChild(dateItem);

    messageContainer.appendChild(item);

    if (!user.messagesItems)
        user.messagesItems = [];

    const messagesItem = {
        item: item,
        photo: photoItem,
        name: nameItem
    };
    user.messagesItems.push(messagesItem);

    return messagesItem;
};

const updateOnlineCounter = () => {
    counterItem.textContent = membersList.length;
};


const updateCurrentUserName = () => {
    currentUserNameItem.textContent = currentUser.name;
};

const updateCurrentUserPhoto = () => {
    currentUserPhotoItem.src = currentUser.photo || NO_PHOTO;
};


const updateMessagesName = (user) => {
    if (!user || !user.messagesItems) return;

    for (const key in user.messagesItems) {
        user.messagesItems[key].name.textContent = user.name;
    }
};

const updateMessagesPhoto = (user) => {
    if (!user || !user.messagesItems) return;

    for (const key in user.messagesItems) {
        user.messagesItems[key].photo.src = user.photo || NO_PHOTO;
    }
};


const updateMemberName = (user, name) => {
    if (!user || user.name == name) return;

    user.name = name;

    if (user.memberItem)
        user.memberItem.textContent = user.name;

    if (user == currentUser)
        updateCurrentUserName();

    updateMessagesName(user);
};

const updateMemberPhoto = (user, photo) => {
    if (!user || user.photo == photo) return;

    user.photo = photo;

    if (user == currentUser)
        updateCurrentUserPhoto();

    updateMessagesPhoto(user);
};

const onLogin = (data) => {
    if (!data) return;

    users = data.users || {};
    membersList = data.membersList || [];

    currentUser = users[currentLogin];

    if (!currentUser) {
        alert('current user not found');
        return;
    }
    
    for (const key in membersList) {
        createMemberItem( users[membersList[key]] );
    }
    updateOnlineCounter();

    updateCurrentUserName();
    updateCurrentUserPhoto();


    for (const key in data.messages) {
        const messageData = data.messages[key];
        createMessageItem(users[messageData.login], messageData.timestamp, messageData.message);
    }

    authPopup.style.display = 'none';
    welcome.style.display = 'none';
    userInfoContainer.style.display = 'block';

    currentUserPhotoItem.addEventListener('click', () => {
        photoPopup.style.display = 'block';
        fakeUploadLabel.style.display = '';
    });
};

const onNewMember = (userData) => {

    if (!membersList.includes(userData.login)) {
        membersList.push(userData.login);

        updateOnlineCounter();
    }
    
    let user = users[userData.login];
    
    if (!user) {
        user = userData;
        users[userData.login] = user;
    }

    if (!user.memberItem)
        createMemberItem(user);

    updateMemberName(user, userData.name);
    updateMemberPhoto(user, userData.photo);
};

const onUpdateName = (userData) => {
    updateMemberName(users[userData.login], userData.name);
};

const onUpdatePhoto = (userData) => {
    updateMemberPhoto(users[userData.login], userData.photo);
};

const onMemberLeft = (login) => {
    const memberIndex = membersList.indexOf(login);

    if (memberIndex != -1) {
        membersList.splice(memberIndex, 1);
        updateOnlineCounter();
    }


    const user = users[login];

    if (user) {
        membersContainer.removeChild(user.memberItem);
        user.memberItem = null;

        if (user == currentUser) {
            socket.close();
            alert('You left the chat');
        }
    }
};

const onUploadPhoto = (status) => {
    if (status === 'ok')
        updateMemberPhoto(currentUser, fileBase);

    fileBase = '';

    closePhotoPopup();
};

const onSendMessage = (data) => {

    if (data) {
        createMessageItem(currentUser, data.timestamp, currentMessage);
    }

    currentMessage = '';
};

const onNewMessage = (messageData) => {
    if (messageData)
        createMessageItem(users[messageData.login], messageData.timestamp, messageData.message);
};

const login = () => {
    currentLogin = userLoginInput.value;

    const data = JSON.stringify({ payload: 'login', data: { login: currentLogin, name: userNameInput.value } });
    socket.send(data);
};

const closePhotoPopup = () => {
    photoPopup.style.display = 'none';
    label.style.backgroundImage = '';
};

const sendMessage = (message) => {
    if (!message || !currentUser || currentMessage) return;

    currentMessage = message;

    const data = JSON.stringify({ payload: 'sendMessage', data: currentMessage });
    socket.send(data);
};

const addPhoto = () => {
    const file = fileInput.files[0];
    if (file.size/1024 > 512) {
        alert ('Размер файла должен быть не больше 512 Кб');
    } else if (file.type !== 'image/jpeg') {
        alert ('Файл должен быть в формате JPEG');
    } else {
        let reader = new FileReader();

        reader.onloadend = function (e) {
            const img = e.target.result;
            const container = label;
            fakeUploadLabel.style.display = 'none';
            fileBase = img;
            container.style.backgroundImage =  `url('${img}')`;
        };

        reader.readAsDataURL(file);
    }
};

const uploadPhoto = () => {
    if (fileBase) {
        const data = JSON.stringify({ payload: 'uploadPhoto', data: fileBase });
        socket.send(data);
    } else {
        alert('Вы не выбрали фото');
    }
};

socket.onopen = function () {
    authPopup.style.display = 'block';
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


    if (res.error) {
        alert('ERROR: ['+ res.payload + '] ' + res.error);
        return;
    }

    switch (res.payload) {
    case 'login':
        onLogin(res.data);
        break;
    case 'newMember':
        onNewMember(res.data);
        break;
    case 'updateName':
        onUpdateName(res.data);
        break;
    case 'updatePhoto':
        onUpdatePhoto(res.data);
        break;
    case 'memberLeft':
        onMemberLeft(res.data);
        break;
    case 'uploadPhoto':
        onUploadPhoto(res.data);
        break;
    case 'sendMessage':
        onSendMessage(res.data);
        break;
    case 'newMessage':
        onNewMessage(res.data);
        break;
    }
};

socket.onerror = function (error) {
    alert('Ошибка ' + error.message);
};

authForm.addEventListener('submit', (e) => {
    login();

    e.preventDefault();
    return false;
});

messageForm.addEventListener('submit', (e) => {

    if (currentUser) {
        sendMessage(messageInput.value);
        messageInput.value = '';
    }

    e.preventDefault();
    return false;
});

fileInput.addEventListener('change', addPhoto);

uploadPhotoButton.addEventListener('click',  uploadPhoto);

cancelPhotoButton.addEventListener('click', closePhotoPopup);


var clusterer, currentCoords, myMap;
const popupWindow = document.querySelector('.popup_window'),
    popupClose = document.querySelector('#close'),
    addReview = document.querySelector('#add_review'),
    storageName = 'marks';

let reviewPlace = document.querySelector('#place'),
    reviewName = document.querySelector('#name'),
    reviewReview = document.querySelector('#review'),
    address = document.querySelector('#address'),
    popupReviews = document.querySelector('.popup-reviews'),
    allMarks = [],
    currentAddress ='';

ymaps.ready(init);

// Создание и настройки карты и балуна, добавление меток из localstorage
function init() {

    myMap = new ymaps.Map('map', {
        center: [61.78, 34.35],
        zoom: 13,
        controls: []
    });

    let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
        '<h2 class = balloonHeader>{{ properties.balloonContentHeader|raw }}</h2>' +
        '<div class = balloonBody>{{ properties.balloonContentBody|raw }}</div>' +
        '<div class = balloonFooter>{{ properties.balloonContentFooter|raw }}</div>'
    );

    let selected = document.querySelector('a.listItem');

    if (selected) {
        selected.addEventListener('click', (e) => {
            e.preventDefault();
        });
    }

    clusterer = new ymaps.Clusterer({
        groupByCoordinates: false,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
        clusterIconColor: '#ff9966',
        clusterOpenBalloonOnClick: true,
        clusterBalloonContentLayout: 'cluster#balloonCarousel',
        clusterBalloonItemContentLayout: customItemContentLayout,
        clusterBalloonPanelMaxMapArea: 0,
        clusterBalloonContentLayoutWidth: 300,
        clusterBalloonContentLayoutHeight: 150,
        clusterBalloonPagerSize: 5

    });

    clusterer.events.add('click', hidePopUp());

    myMap.events.add('click', (e) => {
        e.preventDefault();
        showPopUp(e, e.get('coords'));
    });

    myMap.geoObjects.events.add('balloonopen', hidePopUp());

    myMap.geoObjects.add(clusterer);

    if (localStorage.getItem(storageName)) {
        allMarks = JSON.parse(localStorage.getItem(storageName));
    } else {
        allMarks = [];
    }
    if ( allMarks.length > 0) {
        allMarks.forEach((mark) => {
            mark.reviews.forEach((review) => addPlacemark(mark, review));
        });
    }
}

// Создание метки и ее балуна на карте
const addPlacemark = (mark, review) => {
    let balloonLink = document.createElement('a'),
        balloonText = document.createElement('div'),
        balloonBody = document.createElement('div');

    balloonLink.href = '';
    balloonLink.classList.add('listItem');
    balloonLink.textContent = mark.address;
    balloonLink.setAttribute('onclick', 'clickLink(event)');
    balloonText.textContent = review.text;
    balloonBody.appendChild(balloonLink);
    balloonBody.appendChild(balloonText);

    let placemark = new ymaps.Placemark(mark.coords, {
        balloonContentHeader: review.place,
        balloonContentBody: balloonBody.innerHTML,
        balloonContentFooter: review.date
    }, {

        preset: 'islands#DotIcon',
        iconColor: '#ff9966'
    });

    placemark.events.add('click', (e) => {
        e.preventDefault();
        showPopUp(e, e.get('target').geometry.getCoordinates());
    });
    clusterer.add(placemark);
};

// Событие для клика по ссылке балуна
const clickLink = (event) => {
    event.preventDefault();
    showPopUp(event, [0, 0], event.target.textContent);
};

// События окна PopUp
popupWindow.addEventListener('click', (e) => {
    if (e.target === popupClose) {
        hidePopUp();
    } else if (e.target === addReview) {
        if ((reviewName.value !== '') && (reviewPlace.value !== '') && (reviewReview.value !== '')) {
            createPlacemark(currentCoords);
        }
    }
});

// Показ окна PopUp в зависимости от места клика
const showPopUp = (event, coords, linkAddress) => {
    myMap.balloon.close();
    popupWindow.style.display = 'none';
    reviewName.value = '';
    reviewPlace.value = '';
    reviewReview.value = '';
    address.innerHTML = '';
    popupReviews.innerHTML = '';
    if (event.target && event.target.tagName === 'A') {
        currentAddress = linkAddress;
        selectMark();
        popupWindow.style.top = event.pageY+'px';
        popupWindow.style.left = event.pageX+'px';
        popupWindow.style.display = 'block';
    } else {
        currentCoords = coords;
        getAddress(currentCoords).then(() => {
            selectMark();
            popupWindow.style.top = event.get('domEvent').get('pageY')+'px';
            popupWindow.style.left = event.get('domEvent').get('pageX')+'px';
            popupWindow.style.display = 'block';
        });
    }

};

// Закрытие окна PopUp
const hidePopUp = () => {
    popupWindow.style.display = 'none';
};

// Создание объекта метки для нового отзыва
const createPlacemark = (markCoords) => {
    if (!markCoords) {
        markCoords = currentCoords;
    }
    getAddress(markCoords).then(() => {
        let newMark = searchMark(currentAddress);

        if (!newMark) {
            newMark = {};
            newMark.coords = markCoords;
            newMark.address = currentAddress;
            newMark.reviews = [];
            allMarks.push(newMark);
        }

        let day = new Date().getDate();
        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();

        let newReview = {
            name: reviewName.value,
            place: reviewPlace.value,
            text: reviewReview.value,
            date: day + '.' + month + '.' + year
        };

        newMark.reviews.push(newReview);

        addPlacemark(newMark, newReview);

        getReviews(newMark);

        localStorage.setItem(storageName, JSON.stringify(allMarks));
    });

};

// Установка текущего объекта метки
const selectMark = () => {
    let currentMark = searchMark(currentAddress);

    if (allMarks && currentMark) {
        address.innerHTML = currentMark.address;
        getReviews(currentMark);
        currentCoords = currentMark.coords;
    } else {
        address.innerHTML = currentAddress;
    }
};

// Поиск объекта метки по текущему адресу (для показа в PopUp и добавления отзывов в нее)
const searchMark = (current) => {
    for (let i = 0; i < allMarks.length; i++) {
        if (allMarks[i].address === current) {
            return allMarks[i];
        }
    }
};

// Получение всех отзывов для данного объекта метки и их отображение в PopUp
const getReviews = (mark) => {
    popupReviews.innerHTML = '';
    for (let i = 0; i < mark.reviews.length; i++) {
        const review = mark.reviews[i];
        let divList = document.createElement('div'),
            popupName = document.createElement('span'),
            popupPlace = document.createElement('span'),
            popupReview = document.createElement('div'),
            popupDate = document.createElement('span');

        popupName.innerHTML = review.name + ' ';
        popupPlace.innerHTML = review.place + ' ';
        popupReview.innerHTML = review.text + ' ';
        popupDate.innerHTML = review.date;

        popupName.classList.add('popupName');
        popupPlace.classList.add('popupPlace');
        popupDate.classList.add('popupDate');

        divList.appendChild(popupName);
        divList.appendChild(popupPlace);
        divList.appendChild(popupDate);
        divList.appendChild(popupReview);
        popupReviews.appendChild(divList);

        reviewName.value = '';
        reviewPlace.value = '';
        reviewReview.value = '';

    }
};

// Получение адреса по координатам
const getAddress = (coords) => {
    return ymaps.geocode(coords).then(function (res) {
        let firstGeoObject = res.geoObjects.get(0);

        currentAddress = firstGeoObject.getAddressLine();
    });
};
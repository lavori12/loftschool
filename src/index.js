var clusterer, currentCoords;
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

function init() {

    let myMap = new ymaps.Map('map', {
        center: [61.78, 34.35],
        zoom: 13,
        controls: []
    });

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
        clusterBalloonContentLayoutWidth: 200,
        clusterBalloonContentLayoutHeight: 130,
        clusterBalloonPagerSize: 5

    });

    myMap.events.add('click', (e) => {
        e.preventDefault();
        showPopUp(e, 'map');
    });

    myMap.geoObjects.add(clusterer);

    if (localStorage.getItem(storageName)) {
        allMarks = JSON.parse(localStorage.getItem(storageName));
    } else {
        allMarks = [];
    }
    if ( allMarks.length > 0) {
        allMarks.forEach((mark) => addPlacemark(mark.coords));
    }
}

popupWindow.addEventListener('click', (e) => {
    if (e.target === popupClose) {
        hidePopUp();
    } else if (e.target === addReview) {
        createPlacemark(currentCoords);
        hidePopUp();
    }
});

const showPopUp = (event, target) => {
    reviewName.value = '';
    reviewPlace.value = '';
    reviewReview.value = '';
    address.innerHTML = '';
    popupReviews.innerHTML = '';

    if (target === 'map') {
        currentCoords = event.get('coords');

    } else if (target === 'placemark') {
        currentCoords = event.get('target').geometry.getCoordinates();
    }
    // currentCoords[0] = parseFloat(currentCoords[0].toFixed(3));
    // currentCoords[1] = parseFloat(currentCoords[1].toFixed(3));
    getAddress(currentCoords).then(() => {
        let currentMark = searchMark(currentAddress);

        if (allMarks && currentMark) {
            address.innerHTML = currentMark.address;
            getReviews(currentMark);
        } else {
            address.innerHTML = currentAddress;
        }

        popupWindow.style.top = event.get('domEvent').get('pageY')+'px';
        popupWindow.style.left = event.get('domEvent').get('pageX')+'px';
        popupWindow.style.display = 'block';
    });
};

const hidePopUp = () => {
    popupWindow.style.display = 'none';
};

const addPlacemark = (markCoords) => {
    let placemark = new ymaps.Placemark(markCoords, {}, {

        preset: 'islands#DotIcon',
        iconColor: '#ff9966'
    });

    placemark.events.add('click', (e) => showPopUp(e, 'placemark'));
    clusterer.add(placemark);
};

const createPlacemark = (markCoords) => {
    getAddress(markCoords).then(() => {
        let newMark = searchMark(currentAddress);

        if (!newMark) {
            newMark = {};
            addPlacemark(markCoords);
            newMark.coords = markCoords;
            newMark.address = currentAddress;
            newMark.reviews = [];
            allMarks.push(newMark);
        }

        let day = new Date().getDate();
        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();

        newMark.reviews.push({
            name: reviewName.value,
            place: reviewPlace.value,
            text: reviewReview.value,
            date: day + '.' + month + '.' + year
        });

        localStorage.setItem(storageName, JSON.stringify(allMarks));
    });

};

const getReviews = (mark) => {
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

    }
};

const getAddress = (coords) => {
    return ymaps.geocode(coords).then(function (res) {
        let firstGeoObject = res.geoObjects.get(0);

        currentAddress = firstGeoObject.getAddressLine();
    });
};

const searchMark = (current) => {
    for (let i = 0; i < allMarks.length; i++) {
        if (allMarks[i].address === current) {
            return allMarks[i];
        }
    }
};
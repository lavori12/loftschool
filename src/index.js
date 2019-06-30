var myMap, clusterer;
const popupWindow = document.querySelector('.popup_window'),
    popupClose = document.querySelector('#close'),
    addReview = document.querySelector('#add_review'),
    storageName = 'marks';

let currentCoords = [0, 0],
    reviewPlace = document.querySelector('#place'),
    reviewName = document.querySelector('#name'),
    reviewReview = document.querySelector('#review'),
    address = document.querySelector('#address'),
    popupReviews = document.querySelector('.popup-reviews'),
    allMarks = [],
    currentAddress ='';

ymaps.ready(init);

function init() {

    myMap = new ymaps.Map('map', {
        center: [61.78, 34.35],
        zoom: 13,
        controls: []
    });

    clusterer = new ymaps.Clusterer({
        groupByCoordinates: false,
        clusterDisableClickZoom: true,
        clusterHideIconOnBalloonOpen: false,
        geoObjectHideIconOnBalloonOpen: false,
        clusterIconColor: '#ff9966'
    });

    myMap.events.add('click', (e) => {
        e.preventDefault();
        showPopUp(e);
    });

    myMap.geoObjects.add(clusterer);

    if (localStorage.getItem(storageName)) {
        allMarks = JSON.parse(localStorage.getItem(storageName));
    } else {
        allMarks = [];
    }
    if ( allMarks.length > 0) {
        allMarks.forEach((mark) => createPlacemark(mark.coords));
    }
}

popupWindow.addEventListener('click', (e) => {
    if (e.target === popupClose) {
        hidePopUp();
    } else if (e.target === addReview) {
        createPlacemark(currentCoords);
    }
});

const showPopUp = (event) => {
    popupWindow.style.top = event.get('domEvent').get('pageY')+'px';
    popupWindow.style.left = event.get('domEvent').get('pageX')+'px';
    currentCoords = event.get('coords');
    getAddress(currentCoords);

    if (allMarks && allMarks[currentAddress]) {
        getReviews(allMarks[currentAddress]);
    }
    popupWindow.style.display = 'block';
};

const hidePopUp = () => {
    popupWindow.style.display = 'none';
    currentCoords = [0, 0];
    reviewName.innerHTML = '';
    reviewPlace.innerHTML = '';
    reviewReview.innerHTML = '';
    address.innerHTML = '';
};

const createPlacemark = (markCoords) => {
    let newMark = {};

    newMark.placemark = new ymaps.Placemark(markCoords, {}, {

        preset: 'islands#DotIcon',
        iconColor: '#ff9966'
    });

    newMark.coords = markCoords;

    if (markCoords !== [0, 0]) {
        getAddress(newMark.coords);
        newMark.address = currentAddress;
        if (newMark.address !== '') {
            if (allMarks[newMark.address] !== undefined) {
                clusterer.add(newMark.placemark);
                newMark.reviews = [];
            } else {
                newMark = allMarks[newMark.address];
            }

            newMark.reviews.push({
                name: reviewName,
                place: reviewPlace,
                text: reviewReview
            });

            newMark.addEventListener('click', () => showPopUp());
            allMarks[newMark.address] = newMark;

            localStorage.setItem(storageName, JSON.stringify(allMarks));
        }
    }

    hidePopUp();

};

const getReviews = (mark) => {
    for (let i = 0; i < mark.reviews.length; i++) {
        const review = mark.reviews[i];
        let divList = document.createElement('div'),
            popupName = document.createElement('span'),
            popupPlace = document.createElement('span'),
            popupReview = document.createElement('span');

        popupName.innerHTML = review.name;
        popupPlace.innerHTML = review.place;
        popupReview.innerHTML = review.text;

        divList.appendChild(popupName);
        divList.appendChild(popupPlace);
        divList.appendChild();
        popupReviews.appendChild(divList);

    }
};

const getAddress = (coords) => {
    currentAddress = '';

    ymaps.geocode(coords).then((res) => {
        currentAddress = res.geoObjects.get(0).getAddressLine();
    })
};
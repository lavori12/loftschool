google.maps.event.addDomListener(window, 'load', initMap);

const myMap = new google.maps.Map;
function initMap() {
    myMap = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: -34.397,
            lng: 150.644
        },
        zoom: 8
    });
}
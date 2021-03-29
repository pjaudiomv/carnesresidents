/**
 * Created by jcolfer on 12/19/16.
 */

L.mapbox.accessToken = 'pk.eyJ1IjoiZGlkZXZjbyIsImEiOiJjaXM3cWY3NDEwNDc0Mnpwa2w5YnllMXZkIn0.4pWeAL6-vhtobhpFd2HDuA';

map = L.mapbox.map('imap', 'mapbox.streets', {
    'maxZoom': 19,
    'minZoom': 14,
    'zoom': 15,
    'scrollWheelZoom' : 'center'
}).setView([33.0565, -80.103917]);


var layer = L.mapbox.featureLayer().addTo(map);
map.on('click', function (e) {
    console.log(e.latlng);
});
var stamenLayer = L.tileLayer('https://www.carnescrossroads.com/wp-content/themes/carnes-crossroads/assets/images/map/2021-02-25/{z}/{x}/{y}.png',{
    minZoom: 14,
    maxZoom: 19
}).addTo(map);

var geoJson = {
    type: 'FeatureCollection',
    features: []
};

if(typeof locations != 'undefined') {
    for (var i = 0; i < locations.length; i++) {
        geoJson.features.push({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [parseFloat(locations[i][3]), parseFloat(locations[i][2])]
            },
            "properties": {
                "listing-type": locations[i][4],
                "marker-color": setMarkerColor(locations[i][4]),
                // 'marker-symbol': 'building',
                "pop-up": locations[i][5]
            }
        });
    }
}

layer.setGeoJSON(geoJson);

layer.on('click', function(e) {
    if (!e.layer) return;

    var popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(e.layer.feature.properties["pop-up"])
        .openOn(map)
});

map.setZoom(17);

function setMarkerColor(listingType) {
    var color = null;

    switch (listingType) {
        case 'community_amenity':
            color = '#56c1b1';
            break;

        case 'neighborhood':
            color = '#536377';
            break;

        case 'park_lake':
            color = '#695e49';
            break;

        case 'town_medical_office':
            color = '#bf7616';
            break;

        case 'real_estate':
            color = '#FF0000';
            break;

        default:
            break;
    }

    return color;
}

// In place for map related functions 

let map;
let userGuessMarker = null;
let actualLocationMarker = null;
let line = null;
let clickHandler = null;

export function initMap(onMapClickCallback)
{
    map = L.map("map").setView([20, 0], 2); // World view

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    clickHandler = onMapClickCallback;
    map.on("click", clickHandler);
}

export function placeUserGuessMarker(lat, lng)
{
    if (userGuessMarker) map.removeLayer(userGuessMarker);
    userGuessMarker = L.marker([lat, lng]).addTo(map);
}

export function showActualLocation(lat, lng, label)
{
    if (actualLocationMarker) map.removeLayer(actualLocationMarker);

    actualLocationMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(label)
        .openPopup();   
}

export function drawLineBetweenPoints(guess, actual)
{
    if (line) map.removeLayer(line);

    line = L.polyline(
    [
        [guess.latitude, guess.longitude],
        [actual.latitude, actual.longitude]
    ],
    { color: "red"}
    ).addTo(map);
}

export function fitBound()
{
    const group = L.featureGroup([userGuessMarker, actualLocationMarker]);

    map.fitBounds(group.getBounds(),
    {
        padding: [50, 50],
        animation: true,
        duration: 1
    });
}

export function resetMap()
{
    if (userGuessMarker) map.removeLayer(userGuessMarker);
    if (actualLocationMarker) map.removeLayer(actualLocationMarker);
    if (line) map.removeLayer(line);
}
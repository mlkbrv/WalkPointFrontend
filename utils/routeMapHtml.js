export function buildRouteMapHtml(route, fallbackLat = 55.75, fallbackLng = 37.62, lineColor = '#7C3AED') {
  const coords = Array.isArray(route) ? route.filter((c) => c?.latitude != null && c?.longitude != null) : [];
  const lat = coords[0]?.latitude ?? fallbackLat;
  const lng = coords[0]?.longitude ?? fallbackLng;
  const routePoints = coords.length
    ? coords.map((c) => `[${c.latitude}, ${c.longitude}]`).join(', ')
    : `[${lat}, ${lng}]`;
  const color = lineColor.replace(/'/g, '');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>*{margin:0;padding:0}body,html,#map{width:100%;height:100%}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
var pts = [${routePoints}];
var routeColor = '${color}';
if (pts.length > 1) {
  var line = L.polyline(pts, { color: routeColor, weight: 4, opacity: 0.85 }).addTo(map);
  map.fitBounds(line.getBounds(), { padding: [24, 24] });
} else {
  map.setView(pts[0], 15);
  L.circleMarker(pts[0], { radius: 8, color: routeColor, fillColor: routeColor, fillOpacity: 1 }).addTo(map);
}
</script>
</body>
</html>`;
}

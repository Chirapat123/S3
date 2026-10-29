import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function Map() {
    return (
        <MapContainer
            center={[13.7563, 100.5018]}
            zoom={6}
            style={{ height: "500px", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
        </MapContainer>
    );
}

export default Map;
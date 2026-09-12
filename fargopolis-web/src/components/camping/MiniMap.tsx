import { Marker } from "react-leaflet";
import { CampsiteMapBase } from "./CampsiteMapBase";
import { campsiteMarkerIcon } from "./helpers/mapMarker";

interface MiniMapProps {
    lat: number;
    lng: number;
}

const MINI_MAP_ZOOM = 12;

/** A small, centered single-pin map for one campsite's location. */
export const MiniMap: React.FC<MiniMapProps> = ({ lat, lng }) => (
    <CampsiteMapBase key={`${lat},${lng}`} center={[lat, lng]} zoom={MINI_MAP_ZOOM} height="220px">
        <Marker position={[lat, lng]} icon={campsiteMarkerIcon} />
    </CampsiteMapBase>
);

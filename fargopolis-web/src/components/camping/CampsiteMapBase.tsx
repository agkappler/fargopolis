import { Box } from "@chakra-ui/react";
import { MapContainer, TileLayer } from "react-leaflet";

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

interface CampsiteMapBaseProps {
    /** Initial view; `MapContainer` only applies `center`/`zoom` at mount, so use a child (e.g. `MapRecenter`, `FitMapBounds`) to move an already-mounted map. */
    center: [number, number];
    zoom: number;
    height: string;
    children?: React.ReactNode;
}

export const CampsiteMapBase: React.FC<CampsiteMapBaseProps> = ({ center, zoom, height, children }) => (
    <Box h={height} w="full" borderRadius="md" overflow="hidden" borderWidth="1px" borderColor="border">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
            <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
            {children}
        </MapContainer>
    </Box>
);

import Campsite from "@/models/Campsite";
import { Flex, Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { CampsiteMapBase } from "./CampsiteMapBase";
import { FitMapBounds } from "./FitMapBounds";
import { campsiteMarkerIcon } from "./helpers/mapMarker";

interface CampsiteMapProps {
    campsites: Campsite[];
}

const FALLBACK_ZOOM = 4;
const MAX_FIT_ZOOM = 12;
const MAP_HEIGHT = "360px";

function isMappable(campsite: Campsite): boolean {
    return (
        Number.isFinite(campsite.lat) &&
        Number.isFinite(campsite.lng) &&
        campsite.lat >= -90 &&
        campsite.lat <= 90 &&
        campsite.lng >= -180 &&
        campsite.lng <= 180
    );
}

export const CampsiteMap: React.FC<CampsiteMapProps> = ({ campsites }) => {
    const navigate = useNavigate();
    const mappable = useMemo(() => campsites.filter(isMappable), [campsites]);
    const positions = useMemo<[number, number][]>(() => mappable.map((c) => [c.lat, c.lng]), [mappable]);

    if (positions.length === 0) {
        return (
            <Flex
                h={MAP_HEIGHT}
                mb="4"
                align="center"
                justify="center"
                bg="bg.sunk"
                borderRadius="md"
                borderWidth="1px"
                borderColor="border"
            >
                <Text color="fg.muted">Add a campsite with coordinates to see it on the map.</Text>
            </Flex>
        );
    }

    return (
        <Flex mb="4" direction="column">
            <CampsiteMapBase center={positions[0]} zoom={FALLBACK_ZOOM} height={MAP_HEIGHT}>
                <FitMapBounds positions={positions} maxZoom={MAX_FIT_ZOOM} />
                {mappable.map((c) => (
                    <Marker key={c.campsiteId} position={[c.lat, c.lng]} icon={campsiteMarkerIcon}>
                        <Popup>
                            <Text fontWeight="medium" mb="1">
                                {c.name}
                            </Text>
                            <Text
                                as="button"
                                color="ember.700"
                                textDecoration="underline"
                                cursor="pointer"
                                onClick={() => navigate(`/camping/${c.campsiteId}`)}
                            >
                                View campsite →
                            </Text>
                        </Popup>
                    </Marker>
                ))}
            </CampsiteMapBase>
        </Flex>
    );
};

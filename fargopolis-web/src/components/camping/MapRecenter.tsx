import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface MapRecenterProps {
    lat: number;
    lng: number;
    zoom?: number;
}

/** Smoothly pans/zooms an already-mounted map when its target point changes. */
export const MapRecenter: React.FC<MapRecenterProps> = ({ lat, lng, zoom }) => {
    const map = useMap();

    useEffect(() => {
        map.flyTo([lat, lng], zoom ?? map.getZoom());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, lat, lng, zoom]);

    return null;
};

import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface FitMapBoundsProps {
    positions: [number, number][];
    maxZoom: number;
}

/** Fits an already-mounted map to the given points; re-fits whenever the point set changes. */
export const FitMapBounds: React.FC<FitMapBoundsProps> = ({ positions, maxZoom }) => {
    const map = useMap();

    useEffect(() => {
        if (positions.length === 0) return;
        map.fitBounds(positions, { maxZoom, padding: [24, 24] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, positions, maxZoom]);

    return null;
};

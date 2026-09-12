import { useFormContext } from "react-hook-form";
import { Marker } from "react-leaflet";
import { CampsiteFormValues } from "./CampsiteForm";
import { CampsiteMapBase } from "./CampsiteMapBase";
import { MapRecenter } from "./MapRecenter";
import { campsiteMarkerIcon } from "./helpers/mapMarker";
import { parseCoordinates } from "./helpers/parseCoordinates";

const DEFAULT_CENTER: [number, number] = [39.5, -98.35]; // continental US
const DEFAULT_ZOOM = 4;
const PIN_ZOOM = 12;

/** Live preview pin that tracks the form's pasted coordinates as they parse. */
export const CampsiteFormMapPreview: React.FC = () => {
    const { watch } = useFormContext<CampsiteFormValues>();
    const parsed = parseCoordinates(watch("coordinates") ?? "");

    return (
        <CampsiteMapBase
            center={parsed.ok ? [parsed.value.lat, parsed.value.lng] : DEFAULT_CENTER}
            zoom={parsed.ok ? PIN_ZOOM : DEFAULT_ZOOM}
            height="200px"
        >
            {parsed.ok && (
                <>
                    <Marker position={[parsed.value.lat, parsed.value.lng]} icon={campsiteMarkerIcon} />
                    <MapRecenter lat={parsed.value.lat} lng={parsed.value.lng} zoom={PIN_ZOOM} />
                </>
            )}
        </CampsiteMapBase>
    );
};

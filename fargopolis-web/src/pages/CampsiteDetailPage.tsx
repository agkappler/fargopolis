import { CampsiteForm } from "@/components/camping/CampsiteForm";
import { formatTravelTime } from "@/components/camping/helpers/travelTime";
import { MiniMap } from "@/components/camping/MiniMap";
import { VisitTimeline } from "@/components/camping/VisitTimeline";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { SimpleDialog } from "@/components/ui/SimpleDialog";
import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Campsite from "@/models/Campsite";
import { useAuth } from "@clerk/react";
import { Badge, Box, Button, Flex, Heading, IconButton, Text } from "@chakra-ui/react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useSWR from "swr";

export function CampsiteDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken, isSignedIn } = useAuth();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string>();
    const [isDeleting, setIsDeleting] = useState(false);

    const { data: campsite, error, mutate } = useSWR<Campsite>(
        id ? `/campsite/${id}` : null,
        () => RequestManager.get<Campsite>(`/campsite/${id}`),
    );

    const { data: allCampsites } = useSWR<Campsite[]>(
        "/campsites",
        () => RequestManager.get<Campsite[]>("/campsites"),
    );

    if (!id) {
        return <ErrorMessage errorMessage="Missing campsite id." />;
    }
    if (error) {
        return <ErrorMessage errorMessage={error.message} />;
    }
    if (campsite === undefined) {
        return <LoadingSpinner message="Loading campsite..." />;
    }

    const existingRegions = (allCampsites ?? [])
        .map((c) => c.region ?? "")
        .filter(Boolean) as string[];

    const onDelete = async () => {
        setDeleteError(undefined);
        setIsDeleting(true);
        try {
            await RequestManager.delete(`/campsite/${campsite.campsiteId}`, getToken);
            navigate("/camping");
        } catch (err: unknown) {
            setDeleteError(getErrorMessage(err));
            setIsDeleting(false);
        }
    };

    const mapsUrl = `https://www.google.com/maps?q=${campsite.lat},${campsite.lng}`;
    const firepitLabel =
        campsite.firepit === true ? "Yes" : campsite.firepit === false ? "No" : "Unknown";
    const driveTime = formatTravelTime(campsite.travelTimeMinutes);

    return (
        <>
            <PageHeader
                title={campsite.name}
                leftContainer={<LinkButton label="All Campsites" url="/camping" isForward={false} />}
                rightContainer={
                    isSignedIn ? (
                        <Flex gap={1}>
                            <IconButton
                                variant="ghost"
                                size="md"
                                aria-label="edit"
                                onClick={() => setIsFormOpen(true)}
                            >
                                <Pencil size={18} />
                            </IconButton>
                            <IconButton
                                variant="ghost"
                                size="md"
                                aria-label="delete"
                                onClick={() => setIsConfirmOpen(true)}
                            >
                                <Trash2 size={18} />
                            </IconButton>
                        </Flex>
                    ) : undefined
                }
            />

            <Box p={2} maxW="900px" mx="auto">
                <Flex justify="center" wrap="wrap" gap={2} mb={3}>
                    {campsite.region && <Badge>{`Region: ${campsite.region}`}</Badge>}
                    {campsite.park && <Badge>{`Park: ${campsite.park}`}</Badge>}
                    {driveTime && <Badge>{`Drive time: ${driveTime}`}</Badge>}
                    <Badge>{`Firepit: ${firepitLabel}`}</Badge>
                    {campsite.views != null && <Badge>{`Views: ${campsite.views}/5`}</Badge>}
                    {campsite.privacy != null && <Badge>{`Privacy: ${campsite.privacy}/5`}</Badge>}
                    {campsite.space != null && <Badge>{`Space: ${campsite.space}/5`}</Badge>}
                </Flex>

                <Flex justify="center" gap={2} mb={3} wrap="wrap">
                    <Button asChild variant="outline">
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                            <MapPin size={16} /> View on Google Maps
                        </a>
                    </Button>
                    {campsite.dyrtUrl && (
                        <Button asChild variant="outline">
                            <a href={campsite.dyrtUrl} target="_blank" rel="noopener noreferrer">
                                View on The Dyrt
                            </a>
                        </Button>
                    )}
                </Flex>

                <Text fontSize="sm" textAlign="center" color="fg.muted" mb={3}>
                    {campsite.lat}, {campsite.lng}
                </Text>

                <Box maxW="500px" mx="auto" mb={3}>
                    <MiniMap lat={campsite.lat} lng={campsite.lng} />
                </Box>

                {campsite.notes && (
                    <Box {...surfaceBorderProps} p={3} mb={3}>
                        <Heading size="md" textAlign="center" mb={2}>
                            Notes
                        </Heading>
                        <Text whiteSpace="pre-wrap">{campsite.notes}</Text>
                    </Box>
                )}

                <VisitTimeline campsite={campsite} onChanged={(saved) => mutate(saved)} />
            </Box>

            <CampsiteForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                campsiteData={campsite}
                existingRegions={existingRegions}
                onSaved={() => mutate()}
            />

            <SimpleDialog
                title="Delete campsite?"
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                maxWidth="xs"
            >
                <ErrorMessage errorMessage={deleteError} />
                <Text mb={4}>
                    This removes “{campsite.name}” and its trip history. This cannot be undone.
                </Text>
                <Flex justify="space-between">
                    <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button colorPalette="red" onClick={onDelete} loading={isDeleting}>
                        Delete
                    </Button>
                </Flex>
            </SimpleDialog>
        </>
    );
}

import { getErrorMessage } from "@/helpers/Errors";
import RequestManager, { ApiError } from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Campsite from "@/models/Campsite";
import Visit from "@/models/Visit";
import { useAuth } from "@clerk/react";
import { Badge, Box, Button, Flex, Heading, IconButton, Text } from "@chakra-ui/react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatVisitDateRange } from "./helpers/visitDates";
import { PhotoGallery } from "./PhotoGallery";
import { PhotoUploader } from "./PhotoUploader";
import { VisitForm } from "./VisitForm";
import { ErrorMessage } from "../ui/ErrorMessage";
import { SimpleDialog } from "../ui/SimpleDialog";
import { surfaceBorderProps } from "../ui/surfaceStyle";

interface VisitTimelineProps {
    campsite: Campsite;
    onChanged: (campsite: Campsite) => void;
}

export const VisitTimeline: React.FC<VisitTimelineProps> = ({ campsite, onChanged }) => {
    const { getToken, isSignedIn } = useAuth();
    const [formVisit, setFormVisit] = useState<Visit | "new">();
    const [pendingDelete, setPendingDelete] = useState<Visit>();
    const [deleteError, setDeleteError] = useState<string>();
    const [isDeleting, setIsDeleting] = useState(false);

    const visits = campsite.visits ?? [];

    const onDelete = async () => {
        if (!pendingDelete) return;
        setDeleteError(undefined);
        setIsDeleting(true);
        try {
            const saved = await RequestManager.post<{ campsiteId: string; visitId: string }, Campsite>(
                "/deleteVisit",
                { campsiteId: campsite.campsiteId, visitId: pendingDelete.visitId },
                getToken,
            );
            onChanged(saved);
            setPendingDelete(undefined);
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 409) {
                errorToast("This campsite changed elsewhere — reload and try again.");
                setPendingDelete(undefined);
            } else {
                setDeleteError(getErrorMessage(error));
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Box {...surfaceBorderProps} p={3}>
            <Flex justify="space-between" align="center" mb={3}>
                <Heading size="md">Visits</Heading>
                {isSignedIn && (
                    <Button size="sm" variant="outline" onClick={() => setFormVisit("new")}>
                        <Plus size={16} /> Add Visit
                    </Button>
                )}
            </Flex>

            {visits.length === 0 && (
                <Text color="fg.muted" textAlign="center">
                    No visits recorded yet.
                </Text>
            )}

            <Flex direction="column" gap={3}>
                {visits.map((visit) => (
                    <Box key={visit.visitId} {...surfaceBorderProps} p={3}>
                        <Flex justify="space-between" align="flex-start" gap={2}>
                            <Box>
                                <Text fontWeight="medium">{formatVisitDateRange(visit.startDate, visit.endDate)}</Text>
                                {visit.people.length > 0 && (
                                    <Text color="fg.muted" fontSize="sm">
                                        {visit.people.join(", ")}
                                    </Text>
                                )}
                            </Box>
                            {isSignedIn && (
                                <Flex gap={1}>
                                    <IconButton
                                        variant="ghost"
                                        size="sm"
                                        aria-label="edit visit"
                                        onClick={() => setFormVisit(visit)}
                                    >
                                        <Pencil size={16} />
                                    </IconButton>
                                    <IconButton
                                        variant="ghost"
                                        size="sm"
                                        aria-label="delete visit"
                                        onClick={() => setPendingDelete(visit)}
                                    >
                                        <Trash2 size={16} />
                                    </IconButton>
                                </Flex>
                            )}
                        </Flex>

                        <Flex gap={2} mt={2} wrap="wrap">
                            {visit.weather && <Badge size="xs">{visit.weather}</Badge>}
                            {visit.rating != null && <Badge size="xs">Rating {visit.rating}/5</Badge>}
                        </Flex>

                        {visit.notes && (
                            <Text mt={2} whiteSpace="pre-wrap" fontSize="sm">
                                {visit.notes}
                            </Text>
                        )}

                        <PhotoGallery campsite={campsite} visit={visit} onChanged={onChanged} />
                        <PhotoUploader campsite={campsite} visit={visit} onSaved={onChanged} />
                    </Box>
                ))}
            </Flex>

            <VisitForm
                isOpen={formVisit !== undefined}
                onClose={() => setFormVisit(undefined)}
                campsite={campsite}
                visit={formVisit === "new" ? undefined : formVisit}
                onSaved={onChanged}
            />

            <SimpleDialog
                title="Delete visit?"
                isOpen={pendingDelete !== undefined}
                onClose={() => setPendingDelete(undefined)}
                maxWidth="xs"
            >
                <ErrorMessage errorMessage={deleteError} />
                <Text mb={4}>This removes the visit and cannot be undone.</Text>
                <Flex justify="space-between">
                    <Button variant="outline" onClick={() => setPendingDelete(undefined)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button colorPalette="red" onClick={onDelete} loading={isDeleting}>
                        Delete
                    </Button>
                </Flex>
            </SimpleDialog>
        </Box>
    );
};

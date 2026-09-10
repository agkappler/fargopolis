import { CampsiteCard } from "@/components/camping/CampsiteCard";
import { CampsiteForm } from "@/components/camping/CampsiteForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Campsite from "@/models/Campsite";
import { Box, Grid } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";

export function CampingPage() {
    const [isFormOpen, setIsFormOpen] = useState(false);

    const { data: campsites, error, isLoading, mutate } = useSWR<Campsite[]>(
        "/campsites",
        () => RequestManager.get<Campsite[]>("/campsites"),
    );

    if (isLoading) return <LoadingSpinner message="Loading campsites..." />;
    if (error || campsites === undefined) {
        return <ErrorMessage errorMessage={error?.message ?? "Failed to load campsites."} />;
    }

    const existingRegions = campsites.map((c) => c.region ?? "").filter(Boolean) as string[];

    return (
        <>
            <PageHeader
                title="Camping Catalog"
                rightContainer={<LinkButton url={`/projects/${Project.Camping}`} label="Project Details" />}
            />
            <Box maxW="fp.container" mx="auto" px="6" py="8">
                <Grid
                    templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                    gap="4"
                >
                    <AddModelCard onClick={() => setIsFormOpen(true)} title="Add a campsite" />

                    {campsites.map((campsite) => (
                        <CampsiteCard key={campsite.campsiteId} campsite={campsite} />
                    ))}
                </Grid>
            </Box>

            <CampsiteForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                existingRegions={existingRegions}
                onSaved={() => mutate()}
            />
        </>
    );
}

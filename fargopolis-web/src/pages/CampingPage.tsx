import { CampsiteCard } from "@/components/camping/CampsiteCard";
import { CampsiteForm } from "@/components/camping/CampsiteForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorWrapper } from "@/components/ui/ErrorWrapper";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
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

    const existingRegions = (campsites ?? []).map((c) => c.region ?? "").filter(Boolean) as string[];

    return (
        <>
            <PageHeader
                title="Camping Catalog"
                rightContainer={<LinkButton url={`/projects/${Project.Camping}`} label="Project Details" />}
            />
            <Box maxW="fp.container" mx="auto" px="6" py="8">
                <LoadingWrapper isLoading={isLoading}>
                    <ErrorWrapper error={error} errorMessage="Failed to load campsites.">
                        <Grid
                            templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                            gap="4"
                        >
                            <AddModelCard onClick={() => setIsFormOpen(true)} title="Add a campsite" />

                            {campsites?.map((campsite) => (
                                <CampsiteCard key={campsite.campsiteId} campsite={campsite} />
                            ))}
                        </Grid>
                    </ErrorWrapper>
                </LoadingWrapper>
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

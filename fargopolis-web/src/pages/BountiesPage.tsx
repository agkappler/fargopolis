import { BountyCard } from "@/components/bounties/BountyCard";
import { BountyCategoryForm } from "@/components/bounties/BountyCategoryForm";
import { BountyForm } from "@/components/bounties/BountyForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Bounty from "@/models/Bounty";
import BountyCategory from "@/models/BountyCategory";
import { Add } from "@mui/icons-material";
import { Box, Chip, Grid } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

export function BountiesPage() {
    const [isOpen, setIsOpen] = useState(false);
    const onClose = () => {
        setIsOpen(false);
        setSelectedBounty(undefined);
    };
    const [selectedBounty, setSelectedBounty] = useState<Bounty>();
    const onBountyClick = (bounty: Bounty) => {
        setSelectedBounty(() => bounty);
        setIsOpen(true);
    };

    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const onCategoryClose = () => {
        setIsCategoryOpen(false);
    };

    const { data: bounties, error: bountiesError, isLoading: isLoadingBounties, mutate } = useSWR<Bounty[]>(
        "/bounties",
        () => RequestManager.getGateway<Bounty[]>("/bounties"),
    );
    const {
        data: bountyCategories,
        error: bountyCategoriesError,
        isLoading: isLoadingBountyCategories,
        mutate: mutateCategories,
    } = useSWR<BountyCategory[]>("/bountyCategories", () =>
        RequestManager.getGateway<BountyCategory[]>("/bountyCategories"),
    );
    if (bountiesError || bountyCategoriesError) {
        return <ErrorMessage errorMessage={(bountiesError ?? bountyCategoriesError)?.message} />;
    }
    const bountyCategoryMap = (bountyCategories ?? []).reduce(
        (map, category) => {
            map[category.categoryId] = category;
            return map;
        },
        {} as Record<string, BountyCategory>
    );

    return (
        <>
            <PageHeader
                title="Bounty Board"
                rightContainer={<LinkButton url={`/projects/${Project.Bounties}`} label="Project Details" />}
            />
            <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2} marginBottom={2}>
                <LoadingWrapper isLoading={isLoadingBountyCategories} size={20}>
                    <Chip label="Add Category" icon={<Add />} onClick={() => setIsCategoryOpen(true)} />
                    {bountyCategories?.map((category) => (
                        <Chip key={category.categoryId} label={category.name} />
                    ))}
                </LoadingWrapper>
            </Box>
            <Grid container spacing={1} className="mx-2">
                <LoadingWrapper isLoading={isLoadingBounties}>
                    <Grid size={{ sm: 3, xs: 12 }}>
                        <AddModelCard onClick={() => setIsOpen(true)} title="Post Bounty" />
                    </Grid>
                    {bounties?.map((bounty) => (
                        <Grid size={{ sm: 3, xs: 12 }} key={bounty.bountyId}>
                            <BountyCard bounty={bounty} onClick={() => onBountyClick(bounty)} category={bountyCategoryMap[bounty.categoryId]} />
                        </Grid>
                    ))}
                </LoadingWrapper>
            </Grid>
            <BountyForm
                isOpen={isOpen}
                onClose={onClose}
                updateBounties={mutate}
                bountyCategories={bountyCategories ?? []}
                bounty={selectedBounty}
            />
            <BountyCategoryForm isOpen={isCategoryOpen} onClose={onCategoryClose} updateBountyCategories={mutateCategories} />
        </>
    );
}

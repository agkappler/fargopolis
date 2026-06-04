import { BountyCategoryForm } from "@/components/bounties/BountyCategoryForm";
import { BountyCard } from "@/components/bounties/BountyCard";
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
import { Badge, Box, Flex, Grid } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";

export function BountiesPage() {
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
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

    const { data: bounties, error: bountiesError, isLoading: isLoadingBounties, mutate } = useSWR<Bounty[]>(
        "/bounties",
        () => RequestManager.get<Bounty[]>("/bounties"),
    );
    const {
        data: bountyCategories,
        error: bountyCategoriesError,
        isLoading: isLoadingBountyCategories,
        mutate: mutateCategories
    } = useSWR<BountyCategory[]>(
        "/bountyCategories",
        () => RequestManager.get<BountyCategory[]>("/bountyCategories")
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

    return (<>
        <PageHeader
            title="Bounty Board"
            rightContainer={
                <LinkButton url={`/projects/${Project.Bounties}`} label="Project Details" />
            }
        />

        <LoadingWrapper isLoading={isLoadingBountyCategories}>
            <Flex gap="2" align="center" wrap="wrap" px="4" py="2" width="100%" justifyContent="center">
                <Badge role="button" onClick={() => setIsCategoryOpen(true)}>
                    + Category
                </Badge>
                {bountyCategories?.map((category) => (
                    <Badge key={category.categoryId}>{category.name}</Badge>
                ))}
            </Flex>
        </LoadingWrapper>

        <LoadingWrapper isLoading={isLoadingBounties}>
            <Grid
                templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }}
                gap="4"
                px="4"
                py="6"
                maxW="var(--fp-container)"
                mx="auto"
            >
                <Box>
                    <AddModelCard onClick={() => setIsOpen(true)} title="Post Bounty" />
                </Box>

                {bounties?.map((bounty) => (
                    <BountyCard
                        key={bounty.bountyId}
                        bounty={bounty}
                        onClick={() => onBountyClick(bounty)}
                        category={bountyCategoryMap[bounty.categoryId]}
                    />
                ))}
            </Grid>
        </LoadingWrapper>

        <BountyForm isOpen={isOpen} onClose={onClose} updateBounties={mutate} bountyCategories={bountyCategories ?? []} bounty={selectedBounty} />
        <BountyCategoryForm isOpen={isCategoryOpen} onClose={() => setIsCategoryOpen(false)} updateBountyCategories={mutateCategories} />
    </>);
}

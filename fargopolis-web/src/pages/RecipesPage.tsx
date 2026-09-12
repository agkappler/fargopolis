import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorWrapper } from "@/components/ui/ErrorWrapper";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Recipe from "@/models/Recipe";
import { Box, Grid } from "@chakra-ui/react";
import { useState } from "react";
import useSWR from "swr";

export function RecipesPage() {
    const [isOpen, setIsOpen] = useState(false);

    const { data: recipes, error, isLoading, mutate } = useSWR<Recipe[]>(
        "/recipes",
        () => RequestManager.get<Recipe[]>("/recipes"),
    );

    return (
        <>
            <PageHeader
                title="Recipe Box"
                rightContainer={<LinkButton url={`/projects/${Project.Recipes}`} label="Project Details" />}
            />
            <Box maxW="fp.container" mx="auto" px="6" py="8">
                <LoadingWrapper isLoading={isLoading}>
                    <ErrorWrapper error={error} errorMessage="Failed to load recipes.">
                        <Grid
                            templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                            gap="4"
                        >
                            <AddModelCard onClick={() => setIsOpen(true)} title="Slip a new card in" />

                            {/* Recipe index cards */}
                            {recipes?.map((r) => (
                                <RecipeCard key={r.recipeId} recipeData={r} />
                            ))}
                        </Grid>
                    </ErrorWrapper>
                </LoadingWrapper>
            </Box>

            <RecipeForm isOpen={isOpen} onClose={() => setIsOpen(false)} recipeData={undefined} updateRecipe={mutate} />
        </>
    );
}

import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { AddModelCard } from "@/components/ui/AddModelCard";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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

    if (isLoading) return <LoadingSpinner message="Loading recipes..." />;
    if (error || recipes === undefined) {
        return <ErrorMessage errorMessage={error?.message ?? "Failed to load recipes."} />;
    }

    return (
        <>
            <PageHeader
                title="Recipe Box"
                rightContainer={<LinkButton url={`/projects/${Project.Recipes}`} label="Project Details" />}
            />
            <Box maxW="var(--fp-container)" mx="auto" px="6" py="8">
                <Grid
                    templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                    gap="4"
                >
                    <AddModelCard onClick={() => setIsOpen(true)} title="Slip a new card in" />

                    {/* Recipe index cards */}
                    {recipes.map((r) => (
                        <RecipeCard key={r.recipeId} recipeData={r} />
                    ))}
                </Grid>
            </Box>

            <RecipeForm isOpen={isOpen} onClose={() => setIsOpen(false)} recipeData={undefined} updateRecipe={mutate} />
        </>
    );
}

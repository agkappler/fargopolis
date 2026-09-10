import { IngredientList } from "@/components/recipes/IngredientList";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { RecipeSteps } from "@/components/recipes/RecipeSteps";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ImageBox } from "@/components/ui/ImageBox";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { LoadingWrapper } from "@/components/ui/LoadingWrapper";
import { PageHeader } from "@/components/ui/PageHeader";
import RequestManager from "@/helpers/RequestManager";
import Recipe from "@/models/Recipe";
import { Pencil } from "lucide-react";
import { Badge, Box, Heading, IconButton, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";

export function RecipeDetailPage() {
    const { id } = useParams();
    const [isOpen, setIsOpen] = useState(false);
    const onClose = () => {
        setIsOpen(false);
    };

    const { data: recipeData, error, isLoading, mutate } = useSWR<Recipe>(
        id ? `/recipe/${id}` : null,
        () => RequestManager.get<Recipe>(`/recipe/${id}`)
    );
    if (!id) {
        return <ErrorMessage errorMessage="Missing recipe id." />;
    }
    if (error) {
        return <ErrorMessage errorMessage={error.message} />;
    }
    if (recipeData === undefined) {
        return <LoadingSpinner />;
    }

    return (
        <LoadingWrapper isLoading={isLoading} message="Loading recipe data...">
            <PageHeader
                title={recipeData.name}
                leftContainer={<LinkButton label="All Recipes" url="/recipes" isForward={false} />}
                rightContainer={
                    <IconButton variant="ghost" size="md" aria-label="edit" onClick={() => setIsOpen(true)}>
                        <Pencil size={18} />
                    </IconButton>
                }
            />
            {recipeData.avatarId && (
                <>
                    <ImageBox fileId={recipeData.avatarId} altText="Recipe image" />
                </>
            )}
            <Box p={2}>
                <Box display="flex" justifyContent="center" gap={2} mb={2}>
                    <Badge>{`Prep Time: ${recipeData.prepTimeMinutes} min`}</Badge>
                    <Badge>{`Cook Time: ${recipeData.cookTimeMinutes} min`}</Badge>
                    <Badge>{`Total Calories: ${recipeData.totalCalories ?? "TBD"}`}</Badge>
                    <Badge>{`Quantity: ${recipeData.quantity ?? "TBD"}`}</Badge>
                </Box>
                {recipeData.description && (
                    <Box borderWidth="1px" borderColor="border.DEFAULT" padding={2} borderRadius="md">
                        <Heading size="md" textAlign="center">
                            Description
                        </Heading>
                        <Text>{recipeData.description}</Text>
                    </Box>
                )}
                <RecipeSteps recipeId={id} recipeSteps={recipeData.steps ?? []} refreshRecipe={mutate} />
                <IngredientList recipeId={recipeData.recipeId} ingredients={recipeData.ingredients ?? []} refreshRecipe={mutate} />
            </Box>
            <RecipeForm isOpen={isOpen} onClose={onClose} recipeData={recipeData} updateRecipe={mutate} />
        </LoadingWrapper>
    );
}

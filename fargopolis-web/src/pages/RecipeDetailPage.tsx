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
import { Edit } from "@mui/icons-material";
import { Box, Chip, IconButton, Typography } from "@mui/material";
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
    () => RequestManager.getGateway<Recipe>(`/recipe/${id}`)
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
          <IconButton size="medium" aria-label="edit" onClick={() => setIsOpen(true)}>
            <Edit />
          </IconButton>
        }
      />
      {recipeData.avatarId && (
        <>
          <ImageBox fileId={recipeData.avatarId} altText="Recipe image" />
        </>
      )}
      <Box className="p-2">
        <Box display="flex" justifyContent="center" gap={2} mb={2}>
          <Chip label={`Prep Time: ${recipeData.prepTimeMinutes} min`} />
          <Chip label={`Cook Time: ${recipeData.cookTimeMinutes} min`} />
          <Chip label={`Total Calories: ${recipeData.totalCalories ?? "TBD"}`} />
          <Chip label={`Quantity: ${recipeData.quantity ?? "TBD"}`} />
        </Box>
        {recipeData.description && (
          <Box border={1} padding={2} borderRadius={4}>
            <Typography variant="h6" textAlign="center">
              Description
            </Typography>
            <Typography variant="body1">{recipeData.description}</Typography>
          </Box>
        )}
        <RecipeSteps recipeId={id} recipeSteps={recipeData.steps ?? []} refreshRecipe={mutate} />
        <IngredientList recipeId={recipeData.recipeId} ingredients={recipeData.ingredients ?? []} refreshRecipe={mutate} />
      </Box>
      <RecipeForm isOpen={isOpen} onClose={onClose} recipeData={recipeData} updateRecipe={mutate} />
    </LoadingWrapper>
  );
}

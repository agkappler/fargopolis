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
import { Box, Grid } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

export function RecipesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => {
    setIsOpen(false);
  };

  const { data: recipes, error, isLoading, mutate } = useSWR<Recipe[]>("/recipes", () => RequestManager.getGateway<Recipe[]>("/recipes"));
  if (isLoading) {
    return <LoadingSpinner message="Loading recipes..." />;
  }
  if (error || recipes === undefined) {
    return <ErrorMessage errorMessage={error?.message ?? "Failed to load recipes."} />;
  }

  return (
    <>
      <PageHeader title="All Recipes" rightContainer={<LinkButton url={`/projects/${Project.Recipes}`} label="Project Details" />} />
      <Box className="px-2">
        <Grid container spacing={1}>
          <Grid size={{ sm: 4, xs: 12 }}>
            <AddModelCard onClick={() => setIsOpen(true)} title={"Add Recipe"} />
          </Grid>
          {recipes.map((r) => (
            <Grid size={{ sm: 4, xs: 12 }} key={r.recipeId}>
              <RecipeCard recipeData={r} />
            </Grid>
          ))}
        </Grid>
      </Box>
      <RecipeForm isOpen={isOpen} onClose={onClose} recipeData={undefined} updateRecipe={mutate} />
    </>
  );
}

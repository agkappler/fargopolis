import { RecipeForm } from "@/components/recipes/RecipeForm";
import { LinkButton } from "@/components/ui/buttons/LinkButton";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Project } from "@/constants/Projects";
import RequestManager from "@/helpers/RequestManager";
import Recipe from "@/models/Recipe";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";

export function RecipesPage() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

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
                    {/* Add card */}
                    <Box
                        as="button"
                        minH="158px"
                        border="2px dashed"
                        borderColor="border.strong"
                        borderRadius="md"
                        bg="transparent"
                        color="brand.DEFAULT"
                        textStyle="label"
                        display="flex"
                        flexDir="column"
                        alignItems="center"
                        justifyContent="center"
                        gap="2"
                        cursor="pointer"
                        transition="all 200ms"
                        _hover={{ borderColor: "ember.500", color: "accent.hover", transform: "translateY(-2px)" }}
                        onClick={() => setIsOpen(true)}
                    >
                        <Text fontSize="xl" lineHeight="1">+</Text>
                        <Text>Slip a new card in</Text>
                    </Box>

                    {/* Recipe index cards */}
                    {recipes.map((r, i) => (
                        <Box
                            key={r.recipeId}
                            position="relative"
                            bg="bg.raised"
                            border="1px solid"
                            borderColor="border.DEFAULT"
                            borderRadius="sm"
                            px="5"
                            pt="4"
                            pb="4"
                            minH="158px"
                            display="flex"
                            flexDir="column"
                            cursor="pointer"
                            transition="all 200ms"
                            boxShadow="sm"
                            _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                            onClick={() => navigate(`/recipes/${r.recipeId}`)}
                            style={{
                                backgroundImage:
                                    "repeating-linear-gradient(0deg, transparent 0, transparent 27px, rgba(74,110,84,.07) 27px, rgba(74,110,84,.07) 28px)",
                            }}
                            _before={{
                                content: '""',
                                position: "absolute",
                                left: "0",
                                top: "14px",
                                bottom: "14px",
                                width: "2px",
                                bg: "ember.500",
                            }}
                        >
                            <Text textStyle="label" color="fg.subtle" position="absolute" top="3" right="3">
                                № {String(i + 1).padStart(2, "0")}
                            </Text>

                            <Text
                                as="h3"
                                m="0"
                                mb="3"
                                textStyle="display-title"
                                fontSize="lg"
                                color="fg.DEFAULT"
                                letterSpacing="-0.01em"
                                style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80, "WONK" 1' }}
                            >
                                {r.name}
                            </Text>

                            <Flex
                                mt="auto"
                                pt="3"
                                borderTop="1px dashed"
                                borderTopColor="border.DEFAULT"
                                gap="4"
                                textStyle="label"
                                color="fg.muted"
                                flexWrap="wrap"
                            >
                                {r.prepTimeMinutes > 0 && <Text>Prep {r.prepTimeMinutes} min</Text>}
                                {r.cookTimeMinutes > 0 && <Text>Cook {r.cookTimeMinutes} min</Text>}
                                {r.totalCalories > 0  && <Text>{r.totalCalories} cal</Text>}
                                {r.quantity           && <Text>{r.quantity}</Text>}
                            </Flex>
                        </Box>
                    ))}
                </Grid>
            </Box>

            <RecipeForm isOpen={isOpen} onClose={() => setIsOpen(false)} recipeData={undefined} updateRecipe={mutate} />
        </>
    );
}

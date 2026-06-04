import Recipe from "@/models/Recipe";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

interface RecipeCardProps {
    recipeData: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipeData }) => {
    const navigate = useNavigate();
    return (
        <Box
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
            onClick={() => navigate(`/recipes/${recipeData.recipeId}`)}
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
                {recipeData.name}
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
                {recipeData.prepTimeMinutes > 0 && <Text>Prep {recipeData.prepTimeMinutes} min</Text>}
                {recipeData.cookTimeMinutes > 0 && <Text>Cook {recipeData.cookTimeMinutes} min |</Text>}
                {recipeData.totalCalories > 0 && <Text>{recipeData.totalCalories} cal |</Text>}
                {recipeData.quantity && <Text>{recipeData.quantity}</Text>}
            </Flex>
        </Box>
    );
};

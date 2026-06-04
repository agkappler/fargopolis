import Recipe from "@/models/Recipe";
import { Badge, Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ModelCard } from "../ui/ModelCard";

interface RecipeCardProps {
    recipeData: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipeData }) => {
    const navigate = useNavigate();
    return (
        <ModelCard
            borderRadius="sm"
            px="5"
            py="4"
            gap="0"
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
                {recipeData.prepTimeMinutes > 0 && <Badge size="xs">Prep {recipeData.prepTimeMinutes} min</Badge>}
                {recipeData.cookTimeMinutes > 0 && <Badge size="xs">Cook {recipeData.cookTimeMinutes} min</Badge>}
            </Flex>
        </ModelCard>
    );
};

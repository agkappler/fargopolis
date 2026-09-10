import { AbilitySource } from "@/constants/Abilities";
import { Plus } from "lucide-react";
import { Box, Button, Grid, GridItem, Text } from "@chakra-ui/react";
import { useState } from "react";
import { AbilityForm } from "../abilities/AbilityForm";
import { DescriptionList } from "../DescriptionList";

interface FeatureItemProps {
    name: string;
    level: number;
    descriptions: string[];
    characterId?: string;
    className?: string;
    children?: React.ReactNode;
}

export const FeatureItem: React.FC<FeatureItemProps> = ({ name, level, descriptions, characterId, className, children }) => {
    const [isAbilityFormOpen, setIsAbilityFormOpen] = useState(false);

    const getFeatureDescription = () => {
        if (!descriptions) return "";
        return descriptions.join(" ");
    };

    return (
        <>
            <Box className="my-2 p-2 pt-3" borderTopWidth="1px" borderColor="border.DEFAULT">
                <Grid templateColumns="repeat(12, 1fr)">
                    <GridItem colSpan={3}>
                        <Text fontWeight="light" textAlign="left">Level {level}</Text>
                    </GridItem>
                    <GridItem colSpan={6}>
                        <Text fontWeight="bold" textAlign="center">{name}</Text>
                    </GridItem>
                    <GridItem colSpan={3} display="flex" justifyContent="flex-end">
                        {characterId && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAbilityFormOpen(true)}
                            >
                                <Plus size={16} />
                                Create Ability
                            </Button>
                        )}
                    </GridItem>
                </Grid>
                <DescriptionList descriptions={descriptions} />
                {children}
            </Box>
            {characterId && (
                <AbilityForm
                    isOpen={isAbilityFormOpen}
                    onClose={() => setIsAbilityFormOpen(false)}
                    characterId={characterId}
                    defaultSource={AbilitySource.Class}
                    defaultSourceDescription={className || "Class"}
                    defaultName={name}
                    defaultDescription={getFeatureDescription()}
                />
            )}
        </>
    );
}
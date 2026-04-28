import { AbilitySource } from "@/constants/Abilities";
import { Add } from "@mui/icons-material";
import { Box, Button, Grid, Typography } from "@mui/material";
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
            <Box className="my-2 p-2 pt-3" borderTop={1} borderColor="divider">
                <Grid container>
                    <Grid size={3}>
                        <Typography variant="body1" fontWeight="light" textAlign="left">Level {level}</Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography variant="subtitle1" fontWeight="bold" textAlign="center">{name}</Typography>
                    </Grid>
                    <Grid size={3} display="flex" justifyContent="flex-end">
                        {characterId && (
                            <Button
                                variant="text"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => setIsAbilityFormOpen(true)}
                            >
                                Create Ability
                            </Button>
                        )}
                    </Grid>
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
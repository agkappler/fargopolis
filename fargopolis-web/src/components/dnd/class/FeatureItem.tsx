import { AbilitySource } from "@/constants/Abilities";
import { Plus } from "lucide-react";
import { Button } from "@chakra-ui/react";
import { useState } from "react";
import { AbilityForm } from "../abilities/AbilityForm";
import { DescriptionList } from "../DescriptionList";
import { FeatureRow, LevelPill } from "../FeatureRow";

interface FeatureItemProps {
    name: string;
    level?: number;
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
            <FeatureRow
                pill={typeof level === "number" ? <LevelPill level={level} /> : undefined}
                name={name}
                action={characterId && (
                    <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Create ability from ${name}`}
                        onClick={() => setIsAbilityFormOpen(true)}
                    >
                        <Plus size={14} />
                        Ability
                    </Button>
                )}
            >
                <DescriptionList descriptions={descriptions} textAlign="left" />
                {children}
            </FeatureRow>
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

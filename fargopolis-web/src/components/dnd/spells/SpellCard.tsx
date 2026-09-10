import { Spell } from "@/api/dnd5eapi"
import { Box, Text } from "@chakra-ui/react"
import { Info } from "lucide-react"
import { useState } from "react"
import { surfaceCardProps } from "../../ui/surfaceStyle"
import { SpellDetailsModal } from "./SpellDetailsModal"

interface SpellCardProps {
    spell: Spell;
    isKnown?: boolean;
    canEdit: boolean;
    characterId?: string;
    onSpellUpdate?: () => void;
}

export const SpellCard: React.FC<SpellCardProps> = ({
    spell,
    isKnown = false,
    canEdit,
    characterId,
    onSpellUpdate
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return <>
        <Box
            {...surfaceCardProps}
            boxShadow="md"
            className="p-2 flex justify-between"
            role="button"
            cursor="pointer"
            onClick={() => setIsOpen(true)}
        >
            <Text textAlign="center">{spell.name}</Text>
            <Info size={16} />
        </Box>
        {isOpen &&
            <SpellDetailsModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                spell={spell}
                canEdit={canEdit}
                characterId={characterId}
                isKnown={isKnown}
                onSpellUpdate={onSpellUpdate}
            />
        }
    </>
}

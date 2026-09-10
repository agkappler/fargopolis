import { getRelativeUrlInfo, Spell } from "@/api/dnd5eapi";
import RequestManager from "@/helpers/RequestManager";
import { useAuth } from "@clerk/react";
import { Plus, Minus } from "lucide-react";
import { Badge, Box, Button } from "@chakra-ui/react";
import useSWR from "swr";
import { LoadingWrapper } from "../../ui/LoadingWrapper";
import { SimpleDialog } from "../../ui/SimpleDialog";
import { DescriptionList } from "../DescriptionList";

interface SpllDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    spell: Spell;
    canEdit: boolean;
    characterId?: string;
    isKnown?: boolean;
    onSpellUpdate?: () => void;
}

export const SpellDetailsModal: React.FC<SpllDetailsModalProps> = ({
    isOpen,
    onClose,
    spell,
    canEdit,
    characterId,
    isKnown = false,
    onSpellUpdate
}) => {
    const { getToken } = useAuth();
    const { data: spellDetails, isLoading } = useSWR(spell.index, () => getRelativeUrlInfo(spell.url));

    const handleAddSpell = async () => {
        if (characterId && spellDetails) {
            await RequestManager.post(
                `/character/${characterId}/addKnownSpell`,
                {
                    characterId,
                    spellKey: spellDetails.index,
                    spellName: spellDetails.name,
                    spellLevel: spellDetails.level,
                },
                getToken,
            );
            onSpellUpdate?.();
            onClose();
        }
    };

    const handleRemoveSpell = async () => {
        if (characterId && spellDetails) {
            await RequestManager.delete(
                `/character/${characterId}/deleteKnownSpell?spellKey=${spellDetails.index}`,
                getToken,
            );
            onSpellUpdate?.();
            onClose();
        }
    };

    return <SimpleDialog title={spell.name} isOpen={isOpen} onClose={onClose}>
        <LoadingWrapper isLoading={isLoading} size={10}>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2} justifyContent="center">
                {spellDetails?.concentration && <Badge>Concentration</Badge>}
                {spellDetails?.casting_time && <Badge>{`Casting: ${spellDetails.casting_time}`}</Badge>}
                {spellDetails?.range && <Badge>{`Range: ${spellDetails.range}`}</Badge>}
                {spellDetails?.duration && <Badge>{`Duration: ${spellDetails.duration}`}</Badge>}
                {spellDetails?.ritual && <Badge>Ritual</Badge>}
                {spellDetails?.material && <Badge>{`Material: ${spellDetails.material}`}</Badge>}
            </Box>
            <DescriptionList descriptions={spellDetails?.desc} />
        </LoadingWrapper>
        {canEdit && characterId && (
            <Box display="flex" gap={2} marginTop={2}>
                {isKnown
                    ? (
                        <Button
                            variant="secondary"
                            colorPalette="red"
                            onClick={handleRemoveSpell}
                        >
                            <Minus size={16} />
                            Remove from known spells
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleAddSpell}
                        >
                            <Plus size={16} />
                            Add to known spells
                        </Button>
                    )}
            </Box>
        )}
    </SimpleDialog>
}
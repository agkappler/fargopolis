import { getNameForClass } from "@/constants/DndClass";
import { getNameForRace } from "@/constants/DndRace";
import Character from "@/models/Character";
import { Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ImageBox } from "../ui/ImageBox";
import { ModelCard } from "../ui/ModelCard";

interface CharacterCardProps {
    character: Character;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
    const navigate = useNavigate();
    return <ModelCard title={character.name} onClick={() => navigate(`/dnd/${character.characterId}`)}>
        {character.avatarId && <>
            <ImageBox fileId={character.avatarId} altText="Character avatar" />
        </>}
        <Typography variant="body1" color="textSecondary">
            {getNameForRace(character.race)} | {getNameForClass(character.className)}
        </Typography>
    </ModelCard>
}
import { DndClass } from "@/constants/DndClass";
import { LevelInfo } from "@/api/dnd5eapi";
import { InfoOutlineSharp } from "@mui/icons-material";
import { Box, Chip } from "@mui/material";

interface ClassSpecificInfoProps {
    levelInfo: LevelInfo;
}

export const ClassSpecificInfo: React.FC<ClassSpecificInfoProps> = ({ levelInfo }) => {
    const classIndex = levelInfo.class.index;
    const info = levelInfo.class_specific;
    if (InfoOutlineSharp === undefined) return <></>;

    let classInfo: { label: string, value: number | string }[] = [];
    switch (classIndex) {
        case DndClass.Barbarian:
            classInfo = [
                { label: 'Rage Count', value: info.rage_count },
                { label: 'Rage Damage Bonus', value: info.rage_damage_bonus },
                { label: 'Brutal Critical Dice', value: info.brutal_critical_dice }
            ];
            break;
        case DndClass.Bard:
            classInfo = [
                { label: 'Bardic Inspiration Die', value: `d${info.bardic_inspiration_die}` },
                { label: 'Song of Rest Die', value: `d${info.song_of_rest_die}` },
                { label: 'Magical Secrets, Max Level 5', value: info.magical_secrets_max_5 },
                { label: 'Magical Secrets, Max Level 7', value: info.magical_secrets_max_7 },
                { label: 'Magical Secrets, Max Level 9', value: info.magical_secrets_max_9 },
            ];
            break;
        case DndClass.Cleric:
            classInfo = [
                { label: 'Channel Divinity Charges', value: info.channel_divinity_charges },
                { label: 'Destroy Undead CR', value: info.destroy_undead_cr }
            ];
            break;
        case DndClass.Druid:
            classInfo = [
                { label: 'Wild Shape Max CR', value: info.wild_shape_max_cr },
                { label: 'Wild Shape Swim', value: info.wild_shape_swim },
                { label: 'Wild Shape Fly', value: info.wild_shape_fly }
            ];
            break;
        case DndClass.Fighter:
            classInfo = [
                { label: 'Action Surges', value: info.action_surges },
                { label: 'Indomitable Uses', value: info.indomitable_uses },
                { label: 'Extra Attacks', value: info.extra_attacks }
            ];
            break;

        case DndClass.Monk:
            classInfo = [
                { label: 'Ki Points', value: info.ki_points },
                { label: 'Unarmored Movement Bonus', value: `${info.unarmored_movement}ft` },
                { label: 'Martial Arts', value: `${info.martial_arts.dice_count}d${info.martial_arts.dice_value}` }
            ];
            break;
        case DndClass.Paladin:
            classInfo = [
                { label: 'Aura Range', value: `${info.aura_range}ft` },
                { label: 'Lay on Hands Pool', value: `${levelInfo.level * 5}hp` }
            ];
            break;
        case DndClass.Ranger:
            classInfo = [
                { label: 'Favored Enemies', value: info.favored_enemies },
                { label: 'Favored Terrain', value: info.favored_terrain }
            ];
            break;
        case DndClass.Rogue:
            classInfo = [
                { label: 'Sneak Attack', value: `${info.sneak_attack.dice_count}d${info.sneak_attack.dice_value}` }
            ];
            break;
        case DndClass.Sorcerer:
            classInfo = [
                { label: 'Sorcery Points', value: info.sorcery_points },
                { label: 'Metamagic Known', value: info.metamagic_known }
            ];
            break;
        case DndClass.Warlock:
            classInfo = [
                { label: 'Invocations Known', value: info.invocations_known },
                { label: 'Mystic Arcanum, Level 6', value: info.mystic_arcanum_level_6 },
                { label: 'Mystic Arcanum, Level 7', value: info.mystic_arcanum_level_7 },
                { label: 'Mystic Arcanum, Level 8', value: info.mystic_arcanum_level_8 },
                { label: 'Mystic Arcanum, Level 9', value: info.mystic_arcanum_level_9 },
            ];
            break;
        case DndClass.Wizard:
            classInfo = [
                { label: 'Arcane Recovery Levels', value: info.arcane_recovery_levels }
            ];
            break;
        default:
            classInfo = [];
    }

    return <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2} width="100">
        {classInfo.map((item, index) => (
            <Chip key={index} label={`${item.label}: ${item.value}`} />
        ))}
    </Box>
}
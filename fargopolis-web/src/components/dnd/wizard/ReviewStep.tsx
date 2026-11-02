import { ABILITY_KEYS, SKILLS } from "@/constants/Skills";
import { abilityModifier, formatModifier } from "@/helpers/DndMath";
import { useFileMetadata } from "@/helpers/useFileMetadata";
import { Avatar, Box, Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import { useWatch } from "react-hook-form";
import { useCharacterOptions } from "../useCharacterOptions";
import { ABILITY_LABELS, CharacterWizardValues } from "./wizardConfig";

interface ReviewStepProps {
    avatarId?: string;
}

const Section: React.FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <Box border="1px solid" borderColor="border" borderRadius="md" p="3" bg="bg.raised">
        <Text textStyle="label" color="fg.muted" mb="2">{title}</Text>
        {children}
    </Box>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Flex justify="space-between" gap="3" fontSize="xs">
        <Text color="fg.muted">{label}</Text>
        <Text color="fg" textAlign="right">{value}</Text>
    </Flex>
);

const withParen = (main: string, sub?: string) => (sub ? `${main} (${sub})` : main);
const toNum = (v: unknown) => (v === "" || v == null ? NaN : Number(v));

export const ReviewStep: React.FC<ReviewStepProps> = ({ avatarId }) => {
    const v = useWatch<CharacterWizardValues>() as Partial<CharacterWizardValues>;
    const { raceOptions, classOptions, subraceOptions, subclassOptions } = useCharacterOptions(v.race, v.className);
    const { data: avatar } = useFileMetadata(avatarId);

    const labelFor = (opts: { value: string; label: string }[], key?: string) =>
        key ? opts.find(o => o.value === key)?.label ?? key : "";

    const race = withParen(labelFor(raceOptions, v.race), labelFor(subraceOptions, v.subrace));
    const cls = withParen(labelFor(classOptions, v.className), labelFor(subclassOptions, v.subclassName));
    const maxHp = v.hitPoints?.max;
    const initiative = toNum(v.initiativeBonus);
    const saves = v.savingThrowProficiencies ?? [];
    const skills = v.skillProficiencies ?? [];

    return (
        <Stack gap="3" mb={2}>
            <Section title="Identity">
                <Flex align="center" gap="3" mb="2">
                    {avatarId && (
                        <Avatar.Root boxSize="56px">
                            <Avatar.Image src={avatar?.url} alt={v.name} />
                            <Avatar.Fallback name={v.name} />
                        </Avatar.Root>
                    )}
                    <Text textStyle="display-title" fontSize="xl" color="fg">{v.name}</Text>
                </Flex>
                <Stack gap="1">
                    <Row label="Race" value={race} />
                    <Row label="Class" value={cls} />
                    <Row label="Level" value={String(v.level ?? "")} />
                </Stack>
            </Section>

            <Section title="Abilities">
                <Grid templateColumns={{ base: "repeat(3, 1fr)", sm: "repeat(6, 1fr)" }} gap="2">
                    {ABILITY_KEYS.map(k => {
                        const score = toNum(v.abilityScores?.[k]);
                        return (
                            <Box key={k} textAlign="center" border="1px solid" borderColor="border" borderRadius="md" py="2" bg="bg.sunk">
                                <Text textStyle="label" color="fg.muted">{ABILITY_LABELS[k]}</Text>
                                <Text textStyle="display-title" fontSize="lg">{Number.isFinite(score) ? score : "—"}</Text>
                                <Text textStyle="label" color="accent">
                                    {Number.isFinite(score) ? formatModifier(abilityModifier(score)) : ""}
                                </Text>
                            </Box>
                        );
                    })}
                </Grid>
            </Section>

            <Section title="Combat">
                <Stack gap="1">
                    <Row label="Hit Points" value={maxHp !== undefined && maxHp !== "" ? `${maxHp}/${maxHp}` : "—"} />
                    <Row label="Armor Class" value={String(v.armorClass ?? "—")} />
                    <Row label="Initiative" value={Number.isFinite(initiative) ? formatModifier(initiative) : "—"} />
                    <Row label="Speed" value={v.speed !== undefined && v.speed !== "" ? `${v.speed} ft` : "—"} />
                </Stack>
            </Section>

            <Section title="Proficiencies">
                <Stack gap="1">
                    <Row label="Saving Throws" value={saves.length ? saves.map(k => ABILITY_LABELS[k]).join(", ") : "None"} />
                    <Row
                        label="Skills"
                        value={skills.length ? skills.map(k => SKILLS.find(s => s.key === k)?.name ?? k).join(", ") : "None"}
                    />
                </Stack>
            </Section>
        </Stack>
    );
};

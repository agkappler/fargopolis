import { surfaceBorderProps } from "@/components/ui/surfaceStyle";
import { ABILITY_KEYS } from "@/constants/Skills";
import { clamp, withStatDefaults } from "@/helpers/CharacterStats";
import { abilityModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import RequestManager from "@/helpers/RequestManager";
import Character, { HitPoints } from "@/models/Character";
import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { useAuth } from "@clerk/react";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { CharacterSubtitle } from "./CharacterSubtitle";

interface StatBlockProps {
    character: Character;
}

const rowProps = {
    justify: "space-between",
    align: "center",
    py: "1.5",
    borderBottomWidth: "1px",
    borderColor: "border.soft",
    _last: { borderBottomWidth: 0 },
} as const;

const StatBox: React.FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
    <Box
        w={{ base: "full", md: "280px" }}
        flex={{ base: "1", md: "0 0 auto" }}
        {...surfaceBorderProps}
        p="3"
    >
        <Text textStyle="label" color="fg.muted" mb="2">{title}</Text>
        {children}
    </Box>
);

const StatRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Flex {...rowProps}>
        <Text textStyle="label">{label}</Text>
        <Text fontFamily="mono">{value}</Text>
    </Flex>
);

interface HpButtonProps {
    label: string;
    symbol: string;
    disabled: boolean;
    onClick: () => void;
}

const HpButton: React.FC<HpButtonProps> = ({ label, symbol, disabled, onClick }) => (
    <IconButton
        aria-label={label}
        size="xs"
        minW="5"
        w="5"
        h="5"
        variant="outline"
        borderRadius="full"
        borderColor="pine.500"
        color="pine.700"
        _hover={{ borderColor: "ember.500", color: "ember.700" }}
        disabled={disabled}
        onClick={onClick}
    >
        {symbol}
    </IconButton>
);

export const StatBlock: React.FC<StatBlockProps> = ({ character }) => {
    const c = withStatDefaults(character);
    const max = c.hitPoints.max;
    const { getToken, isSignedIn } = useAuth();

    const [hp, setHp] = useState<HitPoints>(c.hitPoints);
    const hpRef = useRef<HitPoints>(hp);
    // Latest character, read when each queued save actually runs so a save
    // queued behind a form edit doesn't resend stale name/class/level.
    const characterRef = useRef(character);
    characterRef.current = character;
    const saveChain = useRef<Promise<unknown>>(Promise.resolve());

    // Re-sync only when switching characters, so SWR revalidation doesn't
    // overwrite optimistic HP values.
    useEffect(() => {
        const fresh = withStatDefaults(character).hitPoints;
        hpRef.current = fresh;
        setHp(fresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [character.characterId]);

    const applyHp = (next: { current: number; temp: number }) => {
        const temp = Math.max(0, next.temp);
        const current = clamp(next.current, 0, max + temp);
        const prev = hpRef.current;
        if (prev.current === current && prev.temp === temp) return;

        const updated: HitPoints = { current, max, temp };
        hpRef.current = updated;
        setHp(updated);

        saveChain.current = saveChain.current
            .then(() => RequestManager.post(
                "/updateCharacter",
                { ...characterRef.current, hitPoints: hpRef.current },
                getToken,
            ))
            .catch(err => console.error("Failed to save HP", err));
    };

    const pct = max > 0 ? Math.min(100, (hp.current / max) * 100) : 0;
    const locked = !isSignedIn;

    return (
        <Flex
            direction={{ base: "column", md: "row" }}
            align="stretch"
            justify={{ base: "flex-start", md: "space-between" }}
            gap="4"
            mb="4"
        >
            <StatBox title="Ability Scores">
                {ABILITY_KEYS.map(key => {
                    const score = c.abilityScores[key];
                    return (
                        <Flex key={key} {...rowProps}>
                            <Text textStyle="label" flex="1">{key.toUpperCase()}</Text>
                            <Flex gap="3" align="center">
                                <Text fontFamily="mono">{score}</Text>
                                <Text fontFamily="mono" color="brand" minW="3ch" textAlign="right">
                                    {formatModifier(abilityModifier(score))}
                                </Text>
                            </Flex>
                        </Flex>
                    );
                })}
            </StatBox>

            <Flex flex="0 0 auto" align="center" justify="center" order={{ base: -1, md: 0 }}>
                <CharacterSubtitle character={c} />
            </Flex>

            <StatBox title="Vitals">
                <Box py="1.5" borderBottomWidth="1px" borderColor="border.soft">
                    <Flex justify="space-between" align="center" gap="1" flexWrap="wrap">
                        <Text textStyle="label">HP</Text>
                        <Flex align="center" gap="1" flexWrap="wrap">
                            <HpButton
                                label="Decrease current HP"
                                symbol="−"
                                disabled={locked || hp.current <= 0}
                                onClick={() => applyHp({ current: hpRef.current.current - 1, temp: hpRef.current.temp })}
                            />
                            <Text fontFamily="mono">{hp.current} / {max}</Text>
                            <HpButton
                                label="Increase current HP"
                                symbol="+"
                                disabled={locked || hp.current >= max + hp.temp}
                                onClick={() => applyHp({ current: hpRef.current.current + 1, temp: hpRef.current.temp })}
                            />
                            <Text textStyle="label" color="fg.muted" ml="2">Temp</Text>
                            <HpButton
                                label="Decrease temporary HP"
                                symbol="−"
                                disabled={locked || hp.temp <= 0}
                                onClick={() => applyHp({ current: hpRef.current.current, temp: hpRef.current.temp - 1 })}
                            />
                            <Text fontFamily="mono">{hp.temp}</Text>
                            <HpButton
                                label="Increase temporary HP"
                                symbol="+"
                                disabled={locked}
                                onClick={() => applyHp({ current: hpRef.current.current, temp: hpRef.current.temp + 1 })}
                            />
                        </Flex>
                    </Flex>
                    <Box
                        h="4px"
                        bg="bg.sunk"
                        borderRadius="full"
                        mt="1"
                        role="progressbar"
                        aria-label="Hit points"
                        aria-valuenow={hp.current}
                        aria-valuemin={0}
                        aria-valuemax={max}
                    >
                        <Box h="100%" w={`${pct}%`} bg="brand" borderRadius="full" />
                    </Box>
                </Box>
                <StatRow label="AC" value={c.armorClass} />
                <StatRow label="Initiative" value={formatModifier(c.initiativeBonus)} />
                <StatRow label="Speed" value={`${c.speed} ft`} />
                <StatRow label="Prof. Bonus" value={formatModifier(proficiencyBonusForLevel(c.level))} />
            </StatBox>
        </Flex>
    );
};

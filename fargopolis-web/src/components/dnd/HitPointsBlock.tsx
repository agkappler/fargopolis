import { clamp, withStatDefaults } from "@/helpers/CharacterStats";
import RequestManager from "@/helpers/RequestManager";
import { successToast } from "@/helpers/Toasts";
import Character, { HitPoints } from "@/models/Character";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useAuth } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { HpButton } from "./HpButton";
import { StatBox } from "./StatBox";

interface HitPointsBlockProps {
    character: Character;
}

/** The editable HP tracker and Long Rest button — the gameplay (Actions page) card. */
export const HitPointsBlock: React.FC<HitPointsBlockProps> = ({ character }) => {
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

    const handleLongRest = () => {
        applyHp({ current: max, temp: 0 });
        successToast("Long rest complete — HP restored to max.");
    };

    return (
        <StatBox title="HP">
            <Flex justify="center" align="center" gap="1" flexWrap="wrap">
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
            <Button size="xs" variant="outline" w="full" mt="2" disabled={locked} onClick={handleLongRest}>
                Long Rest
            </Button>
        </StatBox>
    );
};

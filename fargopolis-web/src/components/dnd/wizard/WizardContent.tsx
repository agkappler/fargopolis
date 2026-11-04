import { Spell } from "@/api/dnd5eapi";
import { FileRole } from "@/constants/FileRole";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import FileMetadata from "@/models/FileMetadata";
import { Box, Button, chakra, Flex, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "@clerk/react";
import { Check } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { FileUpload } from "../../inputs/FileUpload";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { useCharacterOptions } from "../useCharacterOptions";
import { AbilityScoresStep } from "./AbilityScoresStep";
import { CombatStep } from "./CombatStep";
import { IdentityStep } from "./IdentityStep";
import { ReviewStep } from "./ReviewStep";
import { SpellsStep } from "./SpellsStep";
import { useClassProficiencies } from "./useClassProficiencies";
import { useClassSpellcasting } from "./useClassSpellcasting";
import { useRaceSpeed } from "./useRaceSpeed";
import { buildPayload, CharacterWizardValues, getEffectiveSteps, WIZARD_DEFAULTS } from "./wizardConfig";

interface WizardContentProps {
    onDone: () => void;
}

export const WizardContent: React.FC<WizardContentProps> = ({ onDone }) => {
    const methods = useForm<CharacterWizardValues>({
        defaultValues: WIZARD_DEFAULTS,
        mode: "onTouched",
        reValidateMode: "onChange",
    });
    const { trigger, getValues, setValue } = methods;
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [rawStep, setStep] = useState(0);
    const [rawMaxVisited, setMaxVisited] = useState(0);
    const [characterId, setCharacterId] = useState<string>();
    const [avatarId, setAvatarId] = useState<string>();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSaving, setIsSaving] = useState(false);
    // What's been saved to the character by the Spells step, so revisits don't duplicate.
    const [savedSpells, setSavedSpells] = useState<Spell[]>([]);
    // Synchronous lock so a double-click / double-Enter can't fire two saves (or two creates).
    const savingRef = useRef(false);

    // The step list depends on the class: non-casters have no Spells step.
    const [race, className, level] = useWatch({ control: methods.control, name: ["race", "className", "level"] });
    const { spellcasting, isCaster } = useClassSpellcasting(className, level);
    const steps = getEffectiveSteps(isCaster);
    const lastStep = steps.length - 1;
    // Clamp in case the list shrank after a later step was visited.
    const step = Math.min(rawStep, lastStep);
    const maxVisited = Math.min(rawMaxVisited, lastStep);
    const current = steps[step];

    // A new class has a different spell list, so drop any pending (unsaved) picks.
    const prevClassRef = useRef(className);
    useEffect(() => {
        if (prevClassRef.current !== className) {
            prevClassRef.current = className;
            setValue("knownSpells", []);
        }
    }, [className, setValue]);

    // Combat-step prefills live here, not in CombatStep, because CombatStep unmounts on every
    // step change (steps render conditionally below) — a ref local to it would reset on each
    // return visit and re-overwrite the user's edits from the (already-cached) SWR data.
    const { isCustomRace } = useCharacterOptions(race, className);
    const raceSpeed = useRaceSpeed(race, isCustomRace);
    const { savingThrows, skillOptions: classSkillOptions } = useClassProficiencies(className);

    const appliedRaceRef = useRef<string>();
    useEffect(() => {
        if (raceSpeed !== undefined && appliedRaceRef.current !== race) {
            appliedRaceRef.current = race;
            setValue("speed", raceSpeed, { shouldDirty: true });
        }
    }, [race, raceSpeed, setValue]);

    const appliedClassRef = useRef<string>();
    useEffect(() => {
        if (savingThrows !== undefined && appliedClassRef.current !== className) {
            appliedClassRef.current = className;
            setValue("savingThrowProficiencies", savingThrows, { shouldDirty: true });
            // A previously-chosen skill may no longer be on the new class's list.
            const currentSkills = getValues("skillProficiencies") ?? [];
            setValue("skillProficiencies", currentSkills.filter(k => classSkillOptions.includes(k)), { shouldDirty: true });
        }
    }, [className, savingThrows, classSkillOptions, setValue, getValues]);

    const saveCharacter = async (): Promise<boolean> => {
        const ok = await trigger(current.fields, { shouldFocus: true });
        if (!ok) return false;
        setIsSaving(true);
        setErrorMessage(undefined);
        const payload = buildPayload(getValues(), characterId);
        // Create vs. update depends only on whether the character exists yet, never on the step.
        if (!characterId) {
            const created = await RequestManager.post<typeof payload, Character>("/createCharacter", payload, getToken);
            setCharacterId(created.characterId);
        } else {
            await RequestManager.post("/updateCharacter", payload, getToken);
        }
        return true;
    };

    const saveSpells = async (): Promise<boolean> => {
        if (!characterId) return true;
        const selected = getValues("knownSpells") ?? [];
        const toAdd = selected.filter(s => !savedSpells.some(x => x.index === s.index));
        const toRemove = savedSpells.filter(s => !selected.some(x => x.index === s.index));
        if (!toAdd.length && !toRemove.length) return true;
        setIsSaving(true);
        setErrorMessage(undefined);
        // One at a time, updating saved state after each, so a partial failure stays accurate.
        let saved = savedSpells;
        for (const s of toRemove) {
            await RequestManager.delete(`/character/${characterId}/deleteKnownSpell?spellKey=${s.index}`, getToken);
            saved = saved.filter(x => x.index !== s.index);
            setSavedSpells(saved);
        }
        for (const s of toAdd) {
            await RequestManager.post(
                `/character/${characterId}/addKnownSpell`,
                { characterId, spellKey: s.index, spellName: s.name, spellLevel: s.level },
                getToken,
            );
            saved = [...saved, s];
            setSavedSpells(saved);
        }
        return true;
    };

    const saveCurrentStep = async (): Promise<boolean> => {
        if (savingRef.current) return false;
        savingRef.current = true;
        try {
            if (current.id === "spells") return await saveSpells();
            return await saveCharacter();
        } catch (e: unknown) {
            setErrorMessage(getErrorMessage(e));
            return false;
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    };

    const goTo = (target: number) => {
        const i = Math.min(target, lastStep);
        setStep(i);
        setMaxVisited(m => Math.max(Math.min(m, lastStep), i));
        setErrorMessage(undefined);
    };

    // Skip makes no request; it just puts the step's selection back to what's saved.
    const onSkip = () => {
        if (savingRef.current) return;
        if (current.id === "spells") setValue("knownSpells", savedSpells);
        goTo(step + 1);
    };

    const onPrimary = async () => {
        if (step === lastStep) {
            onDone();
            return;
        }
        if (await saveCurrentStep()) goTo(step + 1);
    };

    const onDotClick = async (i: number) => {
        if (i < step) {
            goTo(i);
        } else if (i > step && i <= maxVisited) {
            // Jumping forward skips the primary button, so save this step's edits first.
            if (await saveCurrentStep()) goTo(i);
        }
    };

    const onUpload = async (meta: FileMetadata) => {
        try {
            await RequestManager.post(`/updateAvatar?characterId=${characterId}&fileId=${meta.fileId}`, {}, getToken);
            setAvatarId(String(meta.fileId));
        } catch (e: unknown) {
            setErrorMessage(getErrorMessage(e));
        }
    };

    const canWrite = isLoaded && isSignedIn;
    const primaryLabel = step === 0 ? "Create & Continue" : step === lastStep ? "Finish" : "Next";

    return (
        <FormProvider {...methods}>
            <Box pe="10" mb="4">
                <Flex align="flex-start" mb="4">
                    {steps.map((s, i) => {
                        const isCurrent = i === step;
                        // Every step before the furthest one reached has been saved.
                        const isDone = i < maxVisited;
                        const isClickable = !isCurrent && i <= maxVisited && !isSaving;
                        return (
                            <Fragment key={s.id}>
                                {i > 0 && <Box flex="1" h="1px" bg="border.strong" mt="12px" mx="1" />}
                                <Flex direction="column" align="center" gap="1" flexShrink="0">
                                    <chakra.button
                                        type="button"
                                        aria-label={`Step ${i + 1}: ${s.title}`}
                                        aria-current={isCurrent ? "step" : undefined}
                                        disabled={!isClickable}
                                        onClick={() => void onDotClick(i)}
                                        w="24px"
                                        h="24px"
                                        borderRadius="full"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        border="1px solid"
                                        transition="all 200ms"
                                        cursor={isClickable ? "pointer" : "default"}
                                        bg={isCurrent ? "brand" : "bg.raised"}
                                        borderColor={isCurrent || isDone ? "brand" : "border.strong"}
                                        color={isCurrent ? "white" : "brand"}
                                        outline={isCurrent ? "2px solid" : undefined}
                                        outlineColor={isCurrent ? "accent" : undefined}
                                        outlineOffset="2px"
                                        opacity={i > maxVisited ? 0.6 : 1}
                                        _hover={isClickable ? { borderColor: "accent" } : undefined}
                                    >
                                        {isDone && !isCurrent ? <Check size={14} /> : <Text as="span" fontSize="2xs" fontFamily="mono">{i + 1}</Text>}
                                    </chakra.button>
                                    <Text textStyle="label" fontSize="10px" color={isCurrent ? "accent" : "fg.muted"}>
                                        {s.label}
                                    </Text>
                                </Flex>
                            </Fragment>
                        );
                    })}
                </Flex>
                <Flex direction={{ base: "column", sm: "row" }} align={{ base: "flex-start", sm: "center" }} gap="3">
                    {characterId && (
                        <FileUpload
                            label="Avatar"
                            fileRole={FileRole.CharacterAvatar}
                            isAvatar
                            currentAvatarId={avatarId}
                            onUpload={onUpload}
                        />
                    )}
                    <Box>
                        <Heading as="h2" textStyle="display-title" fontSize="2xl" color="fg" m="0">
                            {current.title}
                        </Heading>
                        <Text color="fg.muted" fontSize="sm" mt="1">{current.hint}</Text>
                    </Box>
                </Flex>
            </Box>

            <ErrorMessage errorMessage={errorMessage} />

            <form
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    void onPrimary();
                }}
            >
                {current.id === "identity" && <IdentityStep />}
                {current.id === "abilities" && <AbilityScoresStep />}
                {current.id === "combat" && <CombatStep />}
                {current.id === "spells" && <SpellsStep className={className} spellcasting={spellcasting} />}
                {current.id === "review" && (
                    <ReviewStep avatarId={avatarId} savedSpells={savedSpells} />
                )}

                <Flex justify="space-between" align="center" pt="4" gap="2">
                    {step > 0
                        ? <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} disabled={isSaving}>‹ Back</Button>
                        : <Box w="80px" />}
                    <Text textStyle="label" color="fg.muted">Step {step + 1} of {steps.length}</Text>
                    <Flex gap="2">
                        {current.optional && (
                            <Button type="button" variant="ghost" onClick={onSkip} disabled={isSaving}>
                                Skip for now
                            </Button>
                        )}
                        <Button type="submit" variant="primary" loading={isSaving} disabled={!canWrite}>
                            {primaryLabel}
                        </Button>
                    </Flex>
                </Flex>
                {isLoaded && !isSignedIn && (
                    <Text fontSize="xs" color="fg.muted" textAlign="right" mt="2">Sign in to create a character.</Text>
                )}
            </form>
        </FormProvider>
    );
};

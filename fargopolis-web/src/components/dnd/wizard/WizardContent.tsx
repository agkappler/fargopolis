import { FileRole } from "@/constants/FileRole";
import { getErrorMessage } from "@/helpers/Errors";
import RequestManager from "@/helpers/RequestManager";
import Character from "@/models/Character";
import FileMetadata from "@/models/FileMetadata";
import { Box, Button, chakra, Flex, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "@clerk/react";
import { Check } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { FileUpload } from "../../inputs/FileUpload";
import { ErrorMessage } from "../../ui/ErrorMessage";
import { AbilityScoresStep } from "./AbilityScoresStep";
import { CombatStep } from "./CombatStep";
import { IdentityStep } from "./IdentityStep";
import { ReviewStep } from "./ReviewStep";
import { buildPayload, CharacterWizardValues, STEPS, WIZARD_DEFAULTS } from "./wizardConfig";

const LAST_STEP = STEPS.length - 1;

interface WizardContentProps {
    onDone: () => void;
}

export const WizardContent: React.FC<WizardContentProps> = ({ onDone }) => {
    const methods = useForm<CharacterWizardValues>({
        defaultValues: WIZARD_DEFAULTS,
        mode: "onTouched",
        reValidateMode: "onChange",
    });
    const { trigger, getValues } = methods;
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [step, setStep] = useState(0);
    const [maxVisited, setMaxVisited] = useState(0);
    const [characterId, setCharacterId] = useState<string>();
    const [avatarId, setAvatarId] = useState<string>();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSaving, setIsSaving] = useState(false);
    // Synchronous lock so a double-click / double-Enter can't fire two saves (or two creates).
    const savingRef = useRef(false);

    const saveCurrentStep = async (): Promise<boolean> => {
        if (savingRef.current) return false;
        savingRef.current = true;
        try {
            const ok = await trigger(STEPS[step].fields, { shouldFocus: true });
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
        } catch (e: unknown) {
            setErrorMessage(getErrorMessage(e));
            return false;
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    };

    const goTo = (i: number) => {
        setStep(i);
        setMaxVisited(m => Math.max(m, i));
        setErrorMessage(undefined);
    };

    const onPrimary = async () => {
        if (step === LAST_STEP) {
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
    const primaryLabel = step === 0 ? "Create & Continue" : step === LAST_STEP ? "Finish" : "Next";
    const current = STEPS[step];

    return (
        <FormProvider {...methods}>
            <Box pe="10" mb="4">
                <Flex align="flex-start" mb="4">
                    {STEPS.map((s, i) => {
                        const isCurrent = i === step;
                        // Every step before the furthest one reached has been saved.
                        const isDone = i < maxVisited;
                        const isClickable = !isCurrent && i <= maxVisited && !isSaving;
                        return (
                            <Fragment key={s.label}>
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
                {step === 0 && <IdentityStep />}
                {step === 1 && <AbilityScoresStep />}
                {step === 2 && <CombatStep />}
                {step === 3 && <ReviewStep avatarId={avatarId} />}

                <Flex justify="space-between" align="center" pt="4" gap="2">
                    {step > 0
                        ? <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} disabled={isSaving}>‹ Back</Button>
                        : <Box w="80px" />}
                    <Text textStyle="label" color="fg.muted">Step {step + 1} of {STEPS.length}</Text>
                    <Button type="submit" variant="primary" loading={isSaving} disabled={!canWrite}>
                        {primaryLabel}
                    </Button>
                </Flex>
                {isLoaded && !isSignedIn && (
                    <Text fontSize="xs" color="fg.muted" textAlign="right" mt="2">Sign in to create a character.</Text>
                )}
            </form>
        </FormProvider>
    );
};

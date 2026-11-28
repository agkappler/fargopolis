import { withStatDefaults } from "@/helpers/CharacterStats";
import { applyDamage, applyHeal, longRest as longRestHp, setTempHp } from "@/helpers/HitPoints";
import RequestManager from "@/helpers/RequestManager";
import { errorToast } from "@/helpers/Toasts";
import Character, { HitPoints } from "@/models/Character";
import { useAuth } from "@clerk/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSWRConfig } from "swr";

/** Trailing debounce for the ± steppers, so tapping − five times sends one save. */
export const STEPPER_SAVE_DEBOUNCE_MS = 600;

const sameHp = (a: HitPoints, b: HitPoints) => a.current === b.current && a.max === b.max && a.temp === b.temp;

/**
 * Local HP state for the Play page, saved through `/updateCharacter`. Steppers update right away
 * and save after a 600ms pause; keypad applies and Long Rest save immediately. Saves run one at a
 * time and always send the latest HP with the latest character fields.
 */
export function useHitPointsTracker(character: Character) {
    const { getToken, isSignedIn } = useAuth();
    const { mutate } = useSWRConfig();

    const [hp, setHp] = useState<HitPoints>(() => withStatDefaults(character).hitPoints);
    const hpRef = useRef<HitPoints>(hp);
    // Latest character, read when each queued save actually runs so a save
    // queued behind a form edit doesn't resend stale name/class/level.
    const characterRef = useRef(character);
    characterRef.current = character;
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;
    const saveChain = useRef<Promise<unknown>>(Promise.resolve());
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Re-sync only when switching characters, so SWR revalidation doesn't
    // overwrite optimistic HP values.
    useEffect(() => {
        const fresh = withStatDefaults(character).hitPoints;
        hpRef.current = fresh;
        setHp(fresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [character.characterId]);

    const save = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
            debounceTimer.current = undefined;
        }
        saveChain.current = saveChain.current
            .then(() => {
                const updated = { ...characterRef.current, hitPoints: hpRef.current };
                // Keep the Detail page's cached copy in step for back-navigation.
                void mutate(`/character/${updated.characterId}`, updated, { revalidate: false });
                return RequestManager.post("/updateCharacter", updated, getTokenRef.current);
            })
            .catch(err => {
                console.error("Failed to save HP", err);
                errorToast("Couldn't save HP");
            });
    }, [mutate]);

    const flushPending = useRef(() => {});
    flushPending.current = () => { if (debounceTimer.current) save(); };

    // Don't lose a pending stepper save when leaving the page.
    useEffect(() => () => flushPending.current(), []);

    const update = (next: HitPoints, mode: "now" | "debounced") => {
        if (sameHp(next, hpRef.current)) return;
        hpRef.current = next;
        setHp(next);
        if (mode === "now") {
            save();
            return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(save, STEPPER_SAVE_DEBOUNCE_MS);
    };

    return {
        hp,
        locked: !isSignedIn,
        damage: (n: number) => update(applyDamage(hpRef.current, n), "now"),
        heal: (n: number) => update(applyHeal(hpRef.current, n), "now"),
        setTemp: (n: number) => update(setTempHp(hpRef.current, n), "now"),
        step: (delta: -1 | 1) => update(
            delta < 0 ? applyDamage(hpRef.current, 1) : applyHeal(hpRef.current, 1),
            "debounced",
        ),
        longRest: () => update(longRestHp(hpRef.current), "now"),
    };
}

export type HitPointsTracker = ReturnType<typeof useHitPointsTracker>;

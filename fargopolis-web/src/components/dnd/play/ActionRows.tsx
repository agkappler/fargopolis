import { ChipColor } from "@/components/ui/StatusChip";
import { getColorForAbilitySource, getLabelForAbilitySource } from "@/constants/Abilities";
import { abilityRecoveryTag, abilityUsesSlot, ActionRow, isStandardCastingTime } from "@/helpers/ActionGrouping";
import { findDiceInText, formatDiceExpression, parseDiceExpression } from "@/helpers/Dice";
import { formatModifier } from "@/helpers/DndMath";
import { hasAnySlots, lowestAvailableSlotLevel, ordinal, remaining } from "@/helpers/SpellSlots";
import { weaponAttack } from "@/helpers/WeaponAttack";
import Character from "@/models/Character";
import { Box, chakra, Flex, Text } from "@chakra-ui/react";
import { Info } from "lucide-react";
import { PropsWithChildren, ReactNode, useState } from "react";
import { AbilityDetailsModal } from "../abilities/AbilityDetailsModal";
import { SpellDetailsModal } from "../spells/SpellDetailsModal";
import { useRoller } from "../rolls/rollContext";
import { rollButtonProps } from "../rollStyle";
import type { SpellSlotsState } from "./useSpellSlots";

type RowOf<K extends ActionRow["kind"]> = Extract<ActionRow, { kind: K }>;

const pillProps = {
    ...rollButtonProps,
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    minH: "8",
    px: "3",
    borderRadius: "full",
    fontFamily: "mono",
    fontSize: "xs",
    whiteSpace: "nowrap",
    _disabled: { opacity: 0.5, cursor: "not-allowed", bg: "bg.sunk", color: "fg.muted", _hover: {} },
} as const;

const tagStyles: Record<string, { bg: string; color: string; borderColor: string }> = {
    pine: { bg: "pine.100", color: "pine.700", borderColor: "transparent" },
    ember: { bg: "ember.100", color: "ember.700", borderColor: "transparent" },
    slate: { bg: "transparent", color: "slate.700", borderColor: "slate.300" },
    amber: { bg: "amber.100", color: "amber.700", borderColor: "transparent" },
    stone: { bg: "stone.50", color: "ink.600", borderColor: "transparent" },
};

export const Tag: React.FC<PropsWithChildren<{ tone?: keyof typeof tagStyles }>> = ({ tone = "stone", children }) => (
    <Text
        as="span"
        textStyle="label"
        fontSize="10px"
        px="1.5"
        py="0.5"
        borderRadius="sm"
        borderWidth="1px"
        borderStyle="solid"
        whiteSpace="nowrap"
        {...tagStyles[tone]}
    >
        {children}
    </Text>
);

const toneForChip = (color: ChipColor): keyof typeof tagStyles => {
    switch (color) {
        case "primary": return "pine";
        case "secondary": return "slate";
        case "warning": return "amber";
        default: return "stone";
    }
};

interface RowShellProps {
    name: string;
    tags?: ReactNode;
    meta?: string;
    actions?: ReactNode;
    /** When set, the name becomes a button that opens the full details (spell or ability modal). */
    onOpenDetails?: () => void;
}

/** Shared row layout: name + tags over a one-line muted meta, buttons on the right (wrapping under on phones). */
const RowShell: React.FC<RowShellProps> = ({ name, tags, meta, actions, onOpenDetails }) => (
    <Flex
        as="li"
        align="center"
        gap="2"
        rowGap="2"
        flexWrap="wrap"
        py="2"
        borderBottomWidth="1px"
        borderColor="border.soft"
        _last={{ borderBottomWidth: 0 }}
    >
        <Box flex="1 1 220px" minW="0">
            <Flex align="center" gap="1.5" flexWrap="wrap">
                {onOpenDetails ? (
                    <chakra.button
                        type="button"
                        onClick={onOpenDetails}
                        aria-label={`${name} details`}
                        title="Show details"
                        display="inline-flex"
                        alignItems="center"
                        gap="1"
                        fontWeight="600"
                        fontSize="xs"
                        textAlign="left"
                        cursor="pointer"
                        color="fg"
                        textDecorationLine="underline"
                        textDecorationStyle="dotted"
                        textDecorationColor="border.strong"
                        textUnderlineOffset="3px"
                        _hover={{ color: "ember.700", textDecorationColor: "ember.500" }}
                        _focusVisible={{ outline: "2px solid", outlineColor: "ember.500", outlineOffset: "2px", borderRadius: "sm" }}
                    >
                        {name}
                        <Info size={12} aria-hidden="true" style={{ opacity: 0.6, flexShrink: 0 }} />
                    </chakra.button>
                ) : (
                    <Text fontWeight="600" fontSize="xs">{name}</Text>
                )}
                {tags}
            </Flex>
            {meta && <Text fontSize="2xs" color="fg.muted" truncate title={meta}>{meta}</Text>}
        </Box>
        {actions && <Flex align="center" gap="1.5" flexWrap="wrap" flexShrink="0">{actions}</Flex>}
    </Flex>
);

const joinMeta = (...parts: (string | undefined | null)[]) =>
    parts.map(p => p?.trim()).filter(Boolean).join(" · ");

export const WeaponActionRow: React.FC<{ row: RowOf<"weapon"> | RowOf<"opportunity">; character: Character }> = ({ row, character }) => {
    const { rollD20, rollDice } = useRoller();
    const { weapon } = row;
    const attack = weaponAttack(weapon, character);
    const name = row.kind === "opportunity" ? `Opportunity Attack · ${weapon.name}` : weapon.name;
    // Distinct roll label / accessible name for the opportunity row, which reuses the same weapon.
    const rollName = row.kind === "opportunity" ? `${weapon.name} opportunity` : weapon.name;
    const desc = weapon.description?.trim() ?? "";
    const meta = joinMeta(
        weapon.range,
        desc.length > 60 ? `${desc.slice(0, 60)}…` : desc,
        weapon.damageType,
        attack.damage ? undefined : attack.damageLabel,
    );
    const hit = formatModifier(attack.toHit);

    return (
        <RowShell
            name={name}
            meta={meta}
            actions={<>
                <chakra.button
                    type="button"
                    {...pillProps}
                    aria-label={`Roll ${rollName} attack, ${hit}`}
                    onClick={() => rollD20(`${rollName} attack`, attack.toHit)}
                >
                    Hit {hit}
                </chakra.button>
                {attack.damage && (
                    <chakra.button
                        type="button"
                        {...pillProps}
                        aria-label={`Roll ${rollName} damage, ${attack.damageLabel}`}
                        onClick={() => attack.damage && rollDice(`${rollName} damage`, attack.damage)}
                    >
                        Dmg {attack.damageLabel}
                    </chakra.button>
                )}
            </>}
        />
    );
};

interface SlotButtonProps {
    verb: "Cast" | "Use";
    name: string;
    minLevel: number;
    slots: SpellSlotsState;
    onUse: () => void;
}

/** "Cast · 2nd" + "3 slots" — spends the lowest slot at or above `minLevel`. Red "No slots" when none. */
const SlotButton: React.FC<SlotButtonProps> = ({ verb, name, minLevel, slots, onUse }) => {
    const level = hasAnySlots(slots.max) ? lowestAvailableSlotLevel(slots.max, slots.used, minLevel) : undefined;
    const left = level ? remaining(slots.max, slots.used, level) : 0;
    return (
        <Flex align="center" gap="2">
            <Text fontSize="2xs" color={level ? "fg.muted" : "garnet.500"} whiteSpace="nowrap">
                {level ? `${left} ${left === 1 ? "slot" : "slots"}` : "No slots"}
            </Text>
            <chakra.button
                type="button"
                {...pillProps}
                disabled={!level}
                aria-label={level ? `${verb} ${name} using a ${ordinal(level)}-level slot` : `${verb} ${name}: no slots left`}
                onClick={onUse}
            >
                {verb}{level ? ` · ${ordinal(level)}` : ""}
            </chakra.button>
        </Flex>
    );
};

interface SpellRowProps {
    row: RowOf<"spell">;
    slots: SpellSlotsState;
    onCast: (row: RowOf<"spell">) => void;
}

export const SpellActionRow: React.FC<SpellRowProps> = ({ row, slots, onCast }) => {
    const { knownSpell, details } = row;
    const [detailsOpen, setDetailsOpen] = useState(false);
    const level = details?.level ?? knownSpell.spellLevel ?? 0;
    const name = details?.name ?? knownSpell.spellName;
    const meta = details
        ? joinMeta(isStandardCastingTime(details.casting_time) ? undefined : details.casting_time, details.range, details.duration)
        : "Loading…";

    return (
        <>
        <RowShell
            name={name}
            onOpenDetails={() => setDetailsOpen(true)}
            tags={<>
                <Tag tone={level === 0 ? "stone" : "pine"}>{level === 0 ? "Cantrip" : `${ordinal(level)} level`}</Tag>
                {details?.concentration && <Tag tone="ember">Concentration</Tag>}
                {details?.ritual && <Tag tone="slate">Ritual</Tag>}
            </>}
            meta={meta}
            actions={level === 0 ? (
                <chakra.button type="button" {...pillProps} aria-label={`Cast ${name}`} onClick={() => onCast(row)}>
                    Cast
                </chakra.button>
            ) : (
                <SlotButton verb="Cast" name={name} minLevel={level} slots={slots} onUse={() => onCast(row)} />
            )}
        />
        {detailsOpen && (
            <SpellDetailsModal
                isOpen={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                spell={{
                    index: knownSpell.spellKey,
                    name,
                    level,
                    url: details?.url ?? `/api/2014/spells/${encodeURIComponent(knownSpell.spellKey)}`,
                }}
                canEdit={false}
            />
        )}
        </>
    );
};

interface AbilityRowProps {
    row: RowOf<"ability">;
    slots: SpellSlotsState;
    onUseSlot: (row: RowOf<"ability">) => void;
}

export const AbilityActionRow: React.FC<AbilityRowProps> = ({ row, slots, onUseSlot }) => {
    const { rollDice } = useRoller();
    const { ability } = row;
    const diceText = findDiceInText(ability.description);
    const dice = diceText ? parseDiceExpression(diceText) : undefined;
    const usesSlot = abilityUsesSlot(ability);
    const [detailsOpen, setDetailsOpen] = useState(false);

    return (
        <>
        <RowShell
            name={ability.name}
            onOpenDetails={() => setDetailsOpen(true)}
            tags={<Tag tone={toneForChip(getColorForAbilitySource(ability.source))}>{getLabelForAbilitySource(ability.source)}</Tag>}
            meta={ability.description}
            actions={<>
                {dice && (
                    <chakra.button
                        type="button"
                        {...pillProps}
                        aria-label={`Roll ${ability.name}, ${formatDiceExpression(dice)}`}
                        onClick={() => rollDice(ability.name, dice)}
                    >
                        {formatDiceExpression(dice)}
                    </chakra.button>
                )}
                {usesSlot ? (
                    <SlotButton verb="Use" name={ability.name} minLevel={1} slots={slots} onUse={() => onUseSlot(row)} />
                ) : (
                    <Tag tone="stone">{abilityRecoveryTag(ability)}</Tag>
                )}
            </>}
        />
        {detailsOpen && (
            <AbilityDetailsModal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} ability={ability} />
        )}
        </>
    );
};

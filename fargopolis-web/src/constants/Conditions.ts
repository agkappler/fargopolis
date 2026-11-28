/** The 5e conditions a player can toggle on the Play page (session-only for now — persistence is issue #43). */
export const CONDITIONS = [
    "Blinded",
    "Charmed",
    "Deafened",
    "Frightened",
    "Grappled",
    "Incapacitated",
    "Invisible",
    "Paralyzed",
    "Poisoned",
    "Prone",
    "Restrained",
    "Stunned",
] as const;

export type Condition = typeof CONDITIONS[number];

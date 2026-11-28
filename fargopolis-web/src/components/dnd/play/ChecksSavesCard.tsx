import { ABILITY_KEYS, ABILITY_NAMES } from "@/constants/Skills";
import { withStatDefaults } from "@/helpers/CharacterStats";
import { abilityModifier, checkModifier, formatModifier, proficiencyBonusForLevel } from "@/helpers/DndMath";
import Character from "@/models/Character";
import { Box, Grid, Text } from "@chakra-ui/react";
import { Fragment } from "react";
import { RollCell } from "../RollCell";
import { StatBox } from "../StatBox";

const rowLabelProps = { textStyle: "label", color: "fg.muted", alignSelf: "center", pr: "1" } as const;

/** Compact checks & saves grid for the Play sidebar: STR..CHA columns, a Check row and a Save row. */
export const ChecksSavesCard: React.FC<{ character: Character }> = ({ character }) => {
    const c = withStatDefaults(character);
    const pb = proficiencyBonusForLevel(c.level);

    return (
        <StatBox title="Checks & Saves">
            <Grid templateColumns="auto repeat(6, minmax(0, 1fr))" gap="1" alignItems="center">
                <Box />
                {ABILITY_KEYS.map(key => (
                    <Text key={key} textStyle="label" color="fg" textAlign="center">{key.toUpperCase()}</Text>
                ))}
                {(["check", "save"] as const).map(kind => (
                    <Fragment key={kind}>
                        <Text {...rowLabelProps}>{kind === "check" ? "Check" : "Save"}</Text>
                        {ABILITY_KEYS.map(key => {
                            const name = ABILITY_NAMES[key];
                            const score = c.abilityScores[key];
                            const prof = kind === "save" && c.savingThrowProficiencies.includes(key);
                            const mod = kind === "check" ? abilityModifier(score) : checkModifier(score, pb, prof);
                            return (
                                <RollCell
                                    key={key}
                                    label={`${name} ${kind}`}
                                    modifier={mod}
                                    proficient={prof}
                                    minW="0"
                                    w="full"
                                    px="1"
                                    ariaLabel={`Roll ${name} ${kind}, ${formatModifier(mod)}${prof ? ", proficient" : ""}`}
                                />
                            );
                        })}
                    </Fragment>
                ))}
            </Grid>
        </StatBox>
    );
};

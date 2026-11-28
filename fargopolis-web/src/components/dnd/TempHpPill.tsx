import { Text } from "@chakra-ui/react";

/** The "+N temp" pill shown beside HP when temporary hit points are above 0. */
export const TempHpPill: React.FC<{ temp: number }> = ({ temp }) => temp > 0 ? (
    <Text
        as="span"
        textStyle="label"
        bg="pine.100"
        color="pine.700"
        borderRadius="full"
        px="2"
        py="0.5"
        whiteSpace="nowrap"
    >
        +{temp} temp
    </Text>
) : null;

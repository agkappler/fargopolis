import { PLAY_SHELL_BREAK } from "@/constants/Media";
import { Flex, Link, Text } from "@chakra-ui/react";
import { useMatch } from "react-router-dom";

export const Footer: React.FC = () => {
    // The Play page is a one-viewport app shell on desktop (only its actions column scrolls), so the footer hides there.
    const onPlay = useMatch("/dnd/:id/actions");
    return (
        <Flex
            as="footer"
            css={onPlay ? { [`@media (min-width: ${PLAY_SHELL_BREAK})`]: { display: "none" } } : undefined}
            bg="pine.900"
            color="fg.onDark"
            px="6"
            py="2.5"
            justify="space-between"
            align="center"
            borderTop="3px solid"
            borderTopColor="ember.500"
            flexWrap="wrap"
            gap="3"
        >
            <Flex align="center" gap="2.5" fontSize="xs">
                <img
                    src="/mtn.png"
                    alt=""
                    style={{ height: 18, filter: "invert(1)" }}
                />
                <Text
                    fontFamily="display"
                    fontSize="sm"
                    color="parchment.50"
                    style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80, "WONK" 1' }}
                >
                    Fargopolis
                </Text>
                <Text fontFamily="mono" fontSize="2xs" color="stone.400">
                    · Built by Alex 'Fargo' Kappler
                </Text>
            </Flex>

            <Flex
                gap="5"
                fontFamily="mono"
                fontSize="2xs"
                textTransform="uppercase"
                letterSpacing="0.1em"
            >
                <Link
                    href="https://www.linkedin.com/in/alex-kappler-952749140/"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="stone.200"
                    textDecoration="none"
                    _hover={{ color: "ember.200" }}
                    transition="color 200ms"
                >
                    LinkedIn
                </Link>
                <Link
                    href="https://github.com/agkappler"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="stone.200"
                    textDecoration="none"
                    _hover={{ color: "ember.200" }}
                    transition="color 200ms"
                >
                    GitHub
                </Link>
            </Flex>
        </Flex>
    );
};

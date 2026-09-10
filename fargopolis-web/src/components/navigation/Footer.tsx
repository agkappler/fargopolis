import { Flex, Link, Text } from "@chakra-ui/react";

export const Footer: React.FC = () => {
    return (
        <Flex
            as="footer"
            bg="pine.900"
            color="fg.onDark"
            px="6"
            py="4"
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

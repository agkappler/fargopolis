import { Flex } from "@chakra-ui/react";
import { CircleUserRound } from "lucide-react";
import React from "react";

interface SignInAvatarProps {
    onClick: () => void;
}

export const SignInAvatar: React.FC<SignInAvatarProps> = ({ onClick }) => (
    <Flex
        as="button"
        role="button"
        aria-label="Sign in"
        w="8"
        h="8"
        borderRadius="full"
        border="1px solid"
        borderColor="border"
        bg="transparent"
        color="fg.secondary"
        align="center"
        justify="center"
        flexShrink="0"
        cursor="pointer"
        onClick={onClick}
    >
        <CircleUserRound size={18} />
    </Flex>
);

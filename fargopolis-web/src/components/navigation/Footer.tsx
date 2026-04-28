import { Box, Typography } from "@mui/material"
import { GitHubButton } from "../ui/buttons/GitHubButton"
import { LinkedInButton } from "../ui/buttons/LinkedInButton"

export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-100 mt-5 flex justify-center">
            <Box padding={1.25} textAlign="center">
                <Typography variant="body2">
                    {"Built by Alex 'Fargo' Kappler  |"}
                    <LinkedInButton />
                    |
                    <GitHubButton />
                </Typography>
            </Box>
        </footer>
    )
}
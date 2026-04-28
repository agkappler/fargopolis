import { GitHub } from "@mui/icons-material"
import { IconButton } from "@mui/material"

export const GitHubButton: React.FC = () => {
    return <IconButton
        href="https://github.com/agkappler"
        target="_blank"
        rel="noopener noreferrer"
        color="default"
    >
        <GitHub />
    </IconButton>
}
import { LinkedIn } from "@mui/icons-material"
import { IconButton } from "@mui/material"

export const LinkedInButton: React.FC = () => {
    return <IconButton
        href="https://www.linkedin.com/in/alex-kappler-952749140/"
        target="_blank"
        rel="noopener noreferrer"
        color="primary"
    >
        <LinkedIn />
    </IconButton>
}
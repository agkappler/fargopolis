import { IconButton } from "@chakra-ui/react"

/** GitHub mark — lucide-react dropped brand icons, so the path is inlined. */
const GitHubIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.575.106.785-.25.785-.556 0-.274-.01-1-.015-1.965-3.196.695-3.87-1.54-3.87-1.54-.523-1.33-1.277-1.684-1.277-1.684-1.044-.714.08-.7.08-.7 1.154.082 1.762 1.185 1.762 1.185 1.026 1.758 2.693 1.25 3.35.955.104-.744.402-1.25.73-1.538-2.552-.29-5.235-1.276-5.235-5.68 0-1.255.448-2.28 1.183-3.084-.118-.29-.513-1.46.113-3.043 0 0 .966-.31 3.165 1.178a11 11 0 0 1 5.762 0c2.198-1.488 3.162-1.178 3.162-1.178.628 1.583.233 2.753.115 3.043.737.804 1.182 1.83 1.182 3.084 0 4.415-2.687 5.386-5.247 5.67.413.355.78 1.056.78 2.13 0 1.538-.014 2.778-.014 3.156 0 .308.208.668.79.554A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
)

export const GitHubButton: React.FC = () => {
    return (
        <IconButton asChild variant="ghost" aria-label="GitHub profile">
            <a href="https://github.com/agkappler" target="_blank" rel="noopener noreferrer">
                <GitHubIcon />
            </a>
        </IconButton>
    )
}

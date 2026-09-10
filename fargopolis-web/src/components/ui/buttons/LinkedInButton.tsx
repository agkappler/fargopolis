import { IconButton } from "@chakra-ui/react"

/** LinkedIn mark — lucide-react dropped brand icons, so the path is inlined. */
const LinkedInIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
    </svg>
)

export const LinkedInButton: React.FC = () => {
    return (
        <IconButton asChild variant="ghost" aria-label="LinkedIn profile">
            <a href="https://www.linkedin.com/in/alex-kappler-952749140/" target="_blank" rel="noopener noreferrer">
                <LinkedInIcon />
            </a>
        </IconButton>
    )
}

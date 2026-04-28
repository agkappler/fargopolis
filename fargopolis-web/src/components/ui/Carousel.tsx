import { CAROUSEL_BREAK } from "@/constants/Media";
import { ChevronLeft, ChevronRight, Circle, CircleOutlined } from "@mui/icons-material";
import { Box, Grid, IconButton, Paper, useMediaQuery } from "@mui/material";
import { PropsWithChildren, ReactNode, useState } from "react";

interface CarouselProps extends PropsWithChildren {
    cardContents: ReactNode[];
}

export const Carousel: React.FC<CarouselProps> = ({ cardContents }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const handleNext = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % cardContents.length);
    const handlePrev = () => setCurrentIndex((prevIndex) => (prevIndex - 1 + cardContents.length) % cardContents.length);
    const isMobile = useMediaQuery(`(max-width:${CAROUSEL_BREAK})`);

    return <>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            {!isMobile
                ? (<>
                    {/* Carousel Section */}
                    <Box
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                        width="100%"
                        paddingX={2}
                    >
                        {/* Back Arrow */}
                        <IconButton onClick={handlePrev}><ChevronLeft /></IconButton>

                        {/* Carousel Cards */}
                        <Box gap={2} sx={{
                            width: "100%",
                            height: "210px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}>
                            {cardContents.map((project, index) => {
                                const isCurrent = index === currentIndex;
                                const isLeft = index === (currentIndex - 1 + cardContents.length) % cardContents.length;
                                const isRight = index === (currentIndex + 1) % cardContents.length;

                                return (
                                    <Paper
                                        key={index}
                                        elevation={3}
                                        sx={{
                                            width: "30%",
                                            height: "210px",
                                            opacity: isCurrent ? 1 : ((isLeft || isRight) ? 0.75 : 0),
                                            transform: isCurrent
                                                ? "scale(1)"
                                                : isLeft
                                                    ? "translateX(-50%) scale(0.75)"
                                                    : "translateX(50%) scale(0.75)",
                                            transition: "all 0.5s ease-in-out, opacity 0.5s ease-in-out, left 0.5s ease-in-out",
                                            position: "absolute",
                                            left: isCurrent ? "35%" : isLeft ? "20%" : "50%",
                                            zIndex: isCurrent ? 3 : (isRight || isLeft) ? 2 : 1,

                                            textAlign: "center",
                                            padding: 2,
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1,
                                            alignItems: "center"
                                        }}
                                    >
                                        {project}
                                    </Paper>)
                            })}
                        </Box>

                        {/* Forward Arrow */}
                        <IconButton onClick={handleNext}><ChevronRight /></IconButton>
                    </Box>

                    {/* Pagination Indicators */}
                    <Box display="flex" justifyContent="center" gap={1} marginTop={2}>
                        {cardContents.map((_, index) => (
                            <IconButton key={index} size="small" onClick={() => setCurrentIndex(index)}>
                                {index === currentIndex
                                    ? <Circle fontSize="small" />
                                    : <CircleOutlined fontSize="small" />
                                }
                            </IconButton>
                        ))}
                    </Box>
                </>)
                : (<>
                    <Grid container spacing={1} marginX={2}>
                        {cardContents.map((project, index) => {
                            return (<Grid key={index} size={{ xs: 12, sm: 6 }}>
                                <Paper
                                    key={index}
                                    elevation={3}
                                    sx={{
                                        textAlign: "center",
                                        padding: 2,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1,
                                        alignItems: "center",
                                        height: "100%",
                                        justifyContent: "space-between"
                                    }}
                                >
                                    {project}
                                </Paper>
                            </Grid>)
                        })}
                    </Grid>
                </>)
            }
        </Box >
    </>
}
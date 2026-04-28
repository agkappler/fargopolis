import { Checklist, Description, ListAlt, Settings } from "@mui/icons-material";
import { ProjectStatus } from "./Status";
import { ReactNode } from "react";

export enum Project {
    SiteInfrastructure = 0,
    Recipes = 1,
    Bounties = 2,
    DnD = 3
}

export const FARGOPOLIS_BLURB = "This platform was built as a personal project to explore different technologies, manage my own recipes, gamify recurring tasks as bounties, and organize Dungeons & Dragons characters. It's also a way to showcase my work and experiment with new ideas. Feel free to explore and see what I've been working on!"

export interface IProject {
    name: string;
    description: string;
    imageUrl: string;
    status: ProjectStatus;
    icon: ReactNode;
    url: string;
    todo: string[];
    motivation: string | undefined;
    goals: string[] | undefined;
    vision: string | undefined;
    technology: string | undefined;
}

export const PROJECTS = [
    {
        name: "Site Infrastructure",
        description: "All things infrastructure! Covers the nitty gritty of deployments, hosting, and QoL across all levels of the stack.",
        imageUrl: "https://via.placeholder.com/150",
        status: ProjectStatus.InProgress,
        icon: <Settings className="mr-1" />,
        url: "/",
        todo: [
            "Streamline Deployments",
            "Tech aspects for each project",
            "i18n",
            "Swap to pnpm",
            "JUnit and Jest tests",
            "BaseEnum class?"
        ],
        motivation: undefined,
        goals: undefined,
        vision: undefined,
        technology: undefined
    },
    {
        name: "Recipes",
        description: "Recipe management for custom calorie and quantity tracking across all ingredients.",
        imageUrl: "https://via.placeholder.com/150",
        status: ProjectStatus.InProgress,
        icon: <ListAlt className="mr-1" />,
        url: "/recipes",
        todo: [
            "Transaction handling for new ingredient",
            "Total calories and portions",
        ],
        motivation: undefined,
        goals: undefined,
        vision: undefined,
        technology: undefined
    },
    {
        name: "Daily Bounties",
        description: "Gamifying my recurring tasks and making it easy to generate ToDo lists for any occasion.",
        imageUrl: "https://via.placeholder.com/150",
        status: ProjectStatus.InProgress,
        icon: <Checklist className="mr-1" />,
        url: "/bounties",
        todo: ["Task table", "Task Object", "Task List View"],
        motivation: `I'm an avid lister and I'm constantly writing out ToDo lists in my notebooks and on my whiteboards.
        Over time I found myself running into a few issues with my existing system pretty consistently.  My whiteboards had pretty limited space and I would need to keep erasing old lists and sometimes there's nothing as satisfying as seeing a long list of checked off items. 
        In my notebooks I would often end up with lists that were pretty scattered around and the thought of re-writing and re-organizing everything by hand is usually pretty daunting (Maybe I'll give Bullet Journaling a try someday...). Recurring and long term tasks were another
        issue that either required monopolizing space on the whiteboard to provide a constant reminder (even if I sometimes didn't want it) or writing the same thing over and over again everyday (I'm looking at you 'Gym').
        I finally decided I needed a new system that would address these issues and figured I might as well build one myself.`,
        goals: [
            "Create bounties to track tasks.",
            "Generate ToDo list based on a Bounty playlist."
        ],
        vision: `The inspiration for this new system actually came from video games and the pretty typical Bounty/Contract/Objective system that can be found across many games. I drew the most inspiration from games that I've probably sunk too much time into, namely Destiny 2 and The Finals.`,
        technology: ""
    },
    {
        name: "Character Catalog",
        description: "Basically a digital player's handbook tailored to a single character's needs.",
        imageUrl: "https://via.placeholder.com/150",
        status: ProjectStatus.InProgress,
        icon: <Description className="mr-1" />,
        url: "/dnd",
        todo: ["Add AI chat window"],
        motivation: undefined,
        goals: undefined,
        vision: undefined,
        technology: undefined
    },
];
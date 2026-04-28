import { createContext, useContext, useState, PropsWithChildren } from 'react';
import User from "@/models/User";

interface AppContextType {
    user: User | undefined;
    setUser: React.Dispatch<React.SetStateAction<User | undefined>>;
    isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType>({
    user: undefined,
    setUser: () => { },
    isAuthenticated: false,
});

export function AppProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = user !== undefined;

    return (
        <AppContext.Provider value={{ user, setUser, isAuthenticated }}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}

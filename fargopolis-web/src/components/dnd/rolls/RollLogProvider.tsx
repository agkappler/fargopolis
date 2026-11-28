import { PropsWithChildren, useCallback, useMemo, useRef, useState } from "react";
import { NewRollEntry, RollContext, RollEntry, RollLogContext, RollLogState } from "./rollContext";
import { RollLogDialog } from "./RollLogDialog";
import { RollToast } from "./RollToast";

/** How many rolls the session log keeps (in memory only — persistence is issue #44). */
export const ROLL_LOG_CAP = 20;

/** Collects every roll made inside it into a session log, with a bottom-left toast and a log dialog. */
export const RollLogProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [entries, setEntries] = useState<RollEntry[]>([]);
    const [latest, setLatest] = useState<RollEntry>();
    const [isLogOpen, setIsLogOpen] = useState(false);
    const nextId = useRef(1);

    const record = useCallback((entry: NewRollEntry) => {
        const full: RollEntry = { ...entry, id: `roll-${nextId.current++}`, at: Date.now() };
        setEntries(prev => [full, ...prev].slice(0, ROLL_LOG_CAP));
        setLatest(full);
    }, []);

    const roller = useMemo(() => ({ record }), [record]);
    const log = useMemo<RollLogState>(() => ({
        entries,
        latest,
        isLogOpen,
        openLog: () => setIsLogOpen(true),
        closeLog: () => setIsLogOpen(false),
        clear: () => { setEntries([]); setLatest(undefined); },
    }), [entries, latest, isLogOpen]);

    return (
        <RollContext.Provider value={roller}>
            <RollLogContext.Provider value={log}>
                {children}
                <RollToast entry={latest} onOpenLog={log.openLog} />
                <RollLogDialog
                    isOpen={isLogOpen}
                    entries={entries}
                    onClose={log.closeLog}
                    onClear={log.clear}
                />
            </RollLogContext.Provider>
        </RollContext.Provider>
    );
};

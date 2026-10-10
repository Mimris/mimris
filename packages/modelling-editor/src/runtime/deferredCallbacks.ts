/** Own deferred runtime work for one mounted editor. */
export const createDeferredCallbacks = (
    schedule = setTimeout,
    cancel = clearTimeout,
) => {
    const pending = new Set<ReturnType<typeof setTimeout>>();
    let disposed = false;
    return {
        schedule(callback: () => void, delayMs: number): ReturnType<typeof setTimeout> | undefined {
            if (disposed) return undefined;
            const timer = schedule(() => {
                pending.delete(timer);
                if (!disposed) callback();
            }, delayMs);
            pending.add(timer);
            return timer;
        },
        dispose(): void {
            disposed = true;
            pending.forEach(timer => cancel(timer));
            pending.clear();
        },
    };
};

let hasStorageError = false;

const listeners = new Set();

export function getStorageErrorSnapshot() {
    return hasStorageError;
}

export function subscribeToStorageStatus(listener) {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

export function publishStorageError(hasError) {
    if (hasStorageError === hasError) {
        return;
    }

    hasStorageError = hasError;

    listeners.forEach((listener) => listener());
}
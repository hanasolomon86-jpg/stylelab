const LOG_PREFIX = "[StyleLab]";

function writeLog(level, message) {
    if (typeof message !== "string" || !message.trim()) {
        return;
    }

    try {
        const logMethod = globalThis.console?.[level];

        if (typeof logMethod === "function") {
            logMethod.call(globalThis.console, LOG_PREFIX, message);
        }
    } catch {
        // Logging must never interrupt application functionality.
    }
}

export const logger = {
    info(message) {
        writeLog("info", message);
    },

    warn(message) {
        writeLog("warn", message);
    },

    error(message) {
        writeLog("error", message);
    },
};
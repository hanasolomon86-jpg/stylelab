import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger";

describe("logger", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each(["info", "warn", "error"])(
        "logs messages using the %s level",
        (level) => {
            const consoleSpy = vi
                .spyOn(console, level)
                .mockImplementation(() => { });

            logger[level]("Test message");

            expect(consoleSpy).toHaveBeenCalledWith(
                "[StyleLab]",
                "Test message",
            );
        },
    );

    it("ignores empty messages", () => {
        const consoleSpy = vi
            .spyOn(console, "info")
            .mockImplementation(() => { });

        logger.info("");

        expect(consoleSpy).not.toHaveBeenCalled();
    });

    it("does not interrupt the application when logging fails", () => {
        vi.spyOn(console, "error").mockImplementation(() => {
            throw new Error("Console unavailable");
        });

        expect(() => logger.error("Test error")).not.toThrow();
    });
});
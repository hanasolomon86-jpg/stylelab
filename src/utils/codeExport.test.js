
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    copyCodeToClipboard,
    exportCode,
    getExportFileName,
    getExportMimeType,
} from "./codeExport";

function restoreProperty(target, property, descriptor) {
    if (descriptor) {
        Object.defineProperty(target, property, descriptor);
    } else {
        delete target[property];
    }
}

const originalCreateObjectURLDescriptor =
    Object.getOwnPropertyDescriptor(URL, "createObjectURL");

const originalRevokeObjectURLDescriptor =
    Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");

const originalClipboardDescriptor =
    Object.getOwnPropertyDescriptor(navigator, "clipboard");

function readBlobAsText(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsText(blob);
    });
}

describe("codeExport", () => {
    beforeEach(() => {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });

        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn().mockReturnValue("blob:stylelab-export"),
        });

        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            writable: true,
            value: vi.fn(),
        });

        vi.spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();

        restoreProperty(
            navigator,
            "clipboard",
            originalClipboardDescriptor,
        );

        restoreProperty(
            URL,
            "createObjectURL",
            originalCreateObjectURLDescriptor,
        );

        restoreProperty(
            URL,
            "revokeObjectURL",
            originalRevokeObjectURLDescriptor,
        );

        document.body.innerHTML = "";
    });

    describe("copyCodeToClipboard", () => {
        it("copies the exact generated code to the clipboard", async () => {
            const code = 'const title = "My Component";';

            const result = await copyCodeToClipboard(code);

            expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(code);
            expect(result).toBe(true);
        });

        it("propagates clipboard errors", async () => {
            navigator.clipboard.writeText.mockRejectedValue(
                new Error("Permission denied"),
            );

            await expect(
                copyCodeToClipboard("const value = 1;"),
            ).rejects.toThrow("Permission denied");
        });

        it("rejects when clipboard access is unavailable", async () => {
            Object.defineProperty(navigator, "clipboard", {
                configurable: true,
                value: undefined,
            });

            await expect(
                copyCodeToClipboard("const value = 1;"),
            ).rejects.toThrow("Clipboard access is unavailable");
        });

        it("rejects values that are not strings", async () => {
            await expect(
                copyCodeToClipboard(null),
            ).rejects.toThrow("Code must be a string.");
        });
    });

    describe("getExportFileName", () => {
        it.each([
            ["card", "jsx", "card.jsx"],
            ["card", "css", "card.css"],
            ["card", "tailwind", "card-tailwind.jsx"],
            ["button", "jsx", "button.jsx"],
            ["button", "css", "button.css"],
            ["button", "tailwind", "button-tailwind.jsx"],
            ["input", "jsx", "input.jsx"],
            ["input", "css", "input.css"],
            ["input", "tailwind", "input-tailwind.jsx"],
        ])(
            "returns %s filename for the selected format",
            (componentId, format, expectedFileName) => {
                expect(
                    getExportFileName(componentId, format),
                ).toBe(expectedFileName);
            },
        );

        it("rejects unsupported components", () => {
            expect(() =>
                getExportFileName("unknown", "jsx"),
            ).toThrow("Unsupported component");
        });

        it("rejects unsupported formats", () => {
            expect(() =>
                getExportFileName("card", "scss"),
            ).toThrow("Unsupported code format");
        });
    });

    describe("getExportMimeType", () => {
        it.each([
            ["jsx", "text/javascript;charset=utf-8"],
            ["css", "text/css;charset=utf-8"],
            ["tailwind", "text/javascript;charset=utf-8"],
        ])(
            "returns the correct MIME type for %s",
            (format, expectedMimeType) => {
                expect(getExportMimeType(format)).toBe(
                    expectedMimeType,
                );
            },
        );

        it("rejects unsupported formats", () => {
            expect(() => getExportMimeType("scss")).toThrow(
                "Unsupported code format",
            );
        });
    });

    describe("exportCode", () => {
        it("downloads the exact generated code", async () => {
            const code = 'export default function Card() {\n  return "Hello";\n}';

            let clickedLink;

            vi.spyOn(HTMLAnchorElement.prototype, "click")
                .mockImplementation(function () {
                    clickedLink = this;

                    expect(document.body.contains(this)).toBe(true);
                });

            const result = exportCode({
                code,
                componentId: "card",
                format: "jsx",
            });

            expect(result).toEqual({
                fileName: "card.jsx",
                mimeType: "text/javascript;charset=utf-8",
            });

            expect(clickedLink.download).toBe("card.jsx");
            expect(clickedLink.href).toBe("blob:stylelab-export");

            const blob = URL.createObjectURL.mock.calls[0][0];

            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/javascript;charset=utf-8");
            expect(await readBlobAsText(blob)).toBe(code);

            expect(URL.createObjectURL).toHaveBeenCalledOnce();
            expect(URL.revokeObjectURL).toHaveBeenCalledWith(
                "blob:stylelab-export",
            );

            expect(document.body.contains(clickedLink)).toBe(false);
        });

        it("uses the selected component and format for the filename", () => {
            const result = exportCode({
                code: ".button { color: red; }",
                componentId: "button",
                format: "css",
            });

            expect(result.fileName).toBe("button.css");
            expect(result.mimeType).toBe("text/css;charset=utf-8");
        });

        it("creates a JSX file for Tailwind code", () => {
            const result = exportCode({
                code: "export default function Button() {}",
                componentId: "button",
                format: "tailwind",
            });

            expect(result.fileName).toBe("button-tailwind.jsx");
            expect(result.mimeType).toBe("text/javascript;charset=utf-8");
        });

        it("removes the temporary download element", () => {
            let clickedLink;

            vi.spyOn(HTMLAnchorElement.prototype, "click")
                .mockImplementation(function () {
                    clickedLink = this;
                });

            exportCode({
                code: "const value = 1;",
                componentId: "input",
                format: "jsx",
            });

            expect(clickedLink.isConnected).toBe(false);
            expect(document.querySelector("a[download]")).toBeNull();
        });

        it("releases the object URL when download element creation fails", () => {
            vi.spyOn(document, "createElement").mockImplementation(() => {
                throw new Error("DOM unavailable");
            });

            expect(() =>
                exportCode({
                    code: "const value = 1;",
                    componentId: "card",
                    format: "jsx",
                }),
            ).toThrow("DOM unavailable");

            expect(URL.revokeObjectURL).toHaveBeenCalledWith(
                "blob:stylelab-export",
            );
        });

        it("rejects invalid code before starting a download", () => {
            expect(() =>
                exportCode({
                    code: null,
                    componentId: "card",
                    format: "jsx",
                }),
            ).toThrow("Code must be a string.");

            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });

        it("does not create a download for an unsupported format", () => {
            expect(() =>
                exportCode({
                    code: "some code",
                    componentId: "card",
                    format: "scss",
                }),
            ).toThrow("Unsupported code format");

            expect(URL.createObjectURL).not.toHaveBeenCalled();
        });
    });
});

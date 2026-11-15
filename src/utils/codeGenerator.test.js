
import { describe, expect, it } from "vitest";

import { createInitialWorkspace } from "../reducers/workspaceReducer";

import {
    CODE_FORMATS,
    escapeJsxString,
    generateCss,
    generateJsx,
    generateTailwind,
    normalizeGeneratorOptions,
    resolveImageSource,
    resolveStylesByState,
} from "./codeGenerator";

function createOptions(componentId, componentUpdates = {}) {
    const initialComponent =
        createInitialWorkspace().components[componentId];

    return {
        componentId,
        componentData: {
            ...initialComponent,
            ...componentUpdates,
            content: {
                ...initialComponent.content,
                ...(componentUpdates.content ?? {}),
            },
            styles: {
                ...initialComponent.styles,
                ...(componentUpdates.styles ?? {}),
            },
        },
    };
}

describe("codeGenerator", () => {
    describe("CODE_FORMATS", () => {
        it("supports JSX, CSS and Tailwind formats", () => {
            expect(CODE_FORMATS).toEqual([
                "jsx",
                "css",
                "tailwind",
            ]);
        });
    });

    describe("resolveStylesByState", () => {
        it("inherits Normal styles across all states", () => {
            const styles = resolveStylesByState({
                normal: {
                    backgroundColor: "#ffffff",
                    color: "#111111",
                },
            });

            expect(styles.hover).toEqual({
                backgroundColor: "#ffffff",
                color: "#111111",
            });

            expect(styles.focus).toEqual(styles.hover);
            expect(styles.disabled).toEqual(styles.hover);
            expect(styles.error).toEqual(styles.hover);
        });

        it("allows state-specific styles to override Normal styles", () => {
            const styles = resolveStylesByState({
                normal: {
                    backgroundColor: "#ffffff",
                    color: "#111111",
                },
                hover: {
                    backgroundColor: "#123456",
                },
            });

            expect(styles.hover).toEqual({
                backgroundColor: "#123456",
                color: "#111111",
            });
        });

        it("does not mutate the original styles", () => {
            const original = {
                normal: {
                    backgroundColor: "#ffffff",
                },
                hover: {
                    backgroundColor: "#123456",
                },
            };

            resolveStylesByState(original);

            expect(original.normal.backgroundColor).toBe("#ffffff");
            expect(original.hover.backgroundColor).toBe("#123456");
        });
    });

    describe("escapeJsxString", () => {
        it("converts values into safe JavaScript string literals", () => {
            expect(escapeJsxString('My "Product"')).toBe(
                '"My \\"Product\\""',
            );
        });

        it("handles special characters and new lines", () => {
            const value = 'Line 1\nLine 2 "quoted"';

            expect(escapeJsxString(value)).toBe(
                JSON.stringify(value),
            );
        });

        it("handles null and undefined values safely", () => {
            expect(escapeJsxString(null)).toBe('""');
            expect(escapeJsxString(undefined)).toBe('""');
        });
    });

    describe("resolveImageSource", () => {
        it("returns the source of a selected gallery image", () => {
            expect(resolveImageSource("perfume")).toBe(
                "/images/gallery/perfume.jpg",
            );
        });

        it("returns null when the image is not found", () => {
            expect(resolveImageSource("unknown-image")).toBeNull();
        });

        it("returns null when no image is selected", () => {
            expect(resolveImageSource(null)).toBeNull();
        });
    });

    describe("normalizeGeneratorOptions", () => {
        it("normalizes valid component data", () => {
            const options = normalizeGeneratorOptions(
                createOptions("card"),
            );

            expect(options.componentId).toBe("card");
            expect(options.activeStyleState).toBe("normal");
            expect(options.designEffect).toBe("none");
            expect(options.format).toBe("jsx");
        });

        it("falls back to Normal for an invalid style state", () => {
            const options = normalizeGeneratorOptions({
                ...createOptions("button"),
                activeStyleState: "invalid",
            });

            expect(options.activeStyleState).toBe("normal");
        });

        it("falls back to none for an invalid design effect", () => {
            const options = normalizeGeneratorOptions(
                createOptions("card", {
                    designEffect: "invalid",
                }),
            );

            expect(options.designEffect).toBe("none");
        });

        it("rejects unsupported components", () => {
            expect(() =>
                normalizeGeneratorOptions({
                    componentId: "unknown",
                    componentData: {},
                }),
            ).toThrow("Unsupported component");
        });

        it("rejects missing component data", () => {
            expect(() =>
                normalizeGeneratorOptions({
                    componentId: "card",
                }),
            ).toThrow("Component data is required");
        });

        it("rejects unsupported formats", () => {
            expect(() =>
                normalizeGeneratorOptions({
                    ...createOptions("card"),
                    format: "scss",
                }),
            ).toThrow("Unsupported code format");
        });
    });

    describe("generateJsx", () => {
        it.each(["card", "button", "input"])(
            "generates valid component structure for %s",
            (componentId) => {
                const code = generateJsx(
                    createOptions(componentId),
                );

                expect(code).toContain("export default function Generated");
                expect(code).toContain("stylelab-");
                expect(code).toContain(`import "./${componentId}.css";`);
            },
        );

        it("generates Card JSX with the selected image and layout", () => {
            const code = generateJsx(
                createOptions("card", {
                    layout: "left",
                    content: {
                        imageId: "perfume",
                    },
                }),
            );

            expect(code).toContain('src="/images/gallery/perfume.jpg"');
            expect(code).toContain("stylelab-card--layout-left");
            expect(code).toContain("<article");
        });

        it("generates Card JSX without an image when none is selected", () => {
            const code = generateJsx(createOptions("card"));

            expect(code).not.toContain("<img");
            expect(code).toContain("Product Title");
            expect(code).toContain("Product description");
        });

        it("preserves special characters in Card content", () => {
            const title = 'My "Special" Product';

            const code = generateJsx(
                createOptions("card", {
                    content: { title },
                }),
            );

            expect(code).toContain(
                `<h3>{${JSON.stringify(title)}}</h3>`,
            );
        });

        it("generates a disabled Button correctly", () => {
            const code = generateJsx({
                ...createOptions("button"),
                activeStyleState: "disabled",
            });

            expect(code).toContain("disabled");
            expect(code).toContain(
                "stylelab-preview-state--disabled",
            );
        });

        it("generates an Input with an error indication", () => {
            const code = generateJsx({
                ...createOptions("input"),
                activeStyleState: "error",
            });

            expect(code).toContain('aria-invalid="true"');
            expect(code).toContain("stylelab-input");
        });
    });

    describe("generateCss", () => {
        it.each(["card", "button", "input"])(
            "generates base CSS and state rules for %s",
            (componentId) => {
                const css = generateCss(
                    createOptions(componentId),
                );

                expect(css).toContain(`.stylelab-${componentId}`);
                expect(css).toContain(":hover");
                expect(css).toContain(":focus-visible");
                expect(css).toContain("aria-invalid");
                expect(css).toContain("not-allowed");
            },
        );

        it("generates custom styles and Normal inheritance", () => {
            const css = generateCss(
                createOptions("button", {
                    styles: {
                        normal: {
                            backgroundColor: "#123456",
                            borderRadius: "12px",
                        },
                        hover: {
                            backgroundColor: "#abcdef",
                        },
                    },
                }),
            );

            expect(css).toContain(
                "--component-background: #123456;",
            );

            expect(css).toContain(
                "--component-background: #abcdef;",
            );

            expect(css).toContain("border-radius: 12px;");
        });

        it("generates separate Card content padding", () => {
            const css = generateCss(
                createOptions("card", {
                    styles: {
                        normal: {
                            padding: "24px",
                        },
                    },
                }),
            );

            expect(css).toContain(
                ".stylelab-card .stylelab-card__content",
            );

            expect(css).toContain("padding: 24px;");
        });

        it("includes Glassmorphism styles", () => {
            const css = generateCss(
                createOptions("button", {
                    designEffect: "glassmorphism",
                }),
            );

            expect(css).toContain("backdrop-filter: blur(20px)");
            expect(css).toContain("rgba(255, 255, 255, 0.85)");
        });

        it("includes Neumorphism styles", () => {
            const css = generateCss(
                createOptions("card", {
                    designEffect: "neumorphism",
                }),
            );

            expect(css).toContain("color-mix");
            expect(css).toContain("inset");
        });

        it("rejects unsafe CSS declarations", () => {
            const css = generateCss(
                createOptions("button", {
                    styles: {
                        normal: {
                            padding: "16px; color: red",
                        },
                    },
                }),
            );

            expect(css).not.toContain("color: red");
        });
    });

    describe("generateTailwind", () => {
        it.each(["card", "button", "input"])(
            "generates Tailwind JSX for %s",
            (componentId) => {
                const code = generateTailwind(
                    createOptions(componentId),
                );

                expect(code).toContain("className=");
                expect(code).toContain("transition-all");
                expect(code).toContain("data-style-state");
            },
        );

        it("generates Card image and left layout classes", () => {
            const code = generateTailwind(
                createOptions("card", {
                    layout: "left",
                    content: {
                        imageId: "perfume",
                    },
                }),
            );

            expect(code).toContain("/images/gallery/perfume.jpg");
            expect(code).toContain("flex-row items-stretch");
            expect(code).toContain("group");
        });

        it("generates custom utility classes for Button styles", () => {
            const code = generateTailwind(
                createOptions("button", {
                    styles: {
                        normal: {
                            backgroundColor: "#123456",
                        },
                        hover: {
                            backgroundColor: "#abcdef",
                        },
                    },
                }),
            );

            expect(code).toContain(
                "[--component-background:#123456]",
            );

            expect(code).toContain(
                "data-[style-state=hover]:[--component-background:#abcdef]",
            );
        });

        it("generates disabled and error state attributes", () => {
            const disabledCode = generateTailwind({
                ...createOptions("button"),
                activeStyleState: "disabled",
            });

            const errorCode = generateTailwind({
                ...createOptions("input"),
                activeStyleState: "error",
            });

            expect(disabledCode).toContain("disabled");
            expect(disabledCode).toContain("disabled:opacity-45");

            expect(errorCode).toContain('aria-invalid="true"');
            expect(errorCode).toContain("aria-[invalid=true]:border-red-600");
        });

        it("includes Glassmorphism and Neumorphism utilities", () => {
            const glassCode = generateTailwind(
                createOptions("button", {
                    designEffect: "glassmorphism",
                }),
            );

            const neuCode = generateTailwind(
                createOptions("card", {
                    designEffect: "neumorphism",
                }),
            );

            expect(glassCode).toContain("backdrop-blur-xl");
            expect(glassCode).toContain("backdrop-saturate-150");
            expect(neuCode).toContain("color-mix");
        });
    });
});

const FORMAT_CONFIG = {
    jsx: {
        parser: "babel",
    },
    css: {
        parser: "css",
    },
    tailwind: {
        parser: "babel",
    },
};

async function loadPlugins(format) {
    if (format === "css") {
        return [await import("prettier/plugins/postcss")];
    }

    return Promise.all([
        import("prettier/plugins/babel"),
        import("prettier/plugins/estree"),
    ]);
}

export async function formatGeneratedCode(code, format) {
    const config = FORMAT_CONFIG[format];

    if (!config) {
        throw new Error(`Unsupported code format: ${format}`);
    }

    const [prettier, plugins] = await Promise.all([
        import("prettier/standalone"),
        loadPlugins(format),
    ]);

    return prettier.format(code, {
        ...config,
        plugins,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        trailingComma: "all",
    });
}
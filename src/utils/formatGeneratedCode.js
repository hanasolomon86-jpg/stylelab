import * as prettier from "prettier/standalone";

import * as babelPlugin from "prettier/plugins/babel";
import * as estreePlugin from "prettier/plugins/estree";
import * as postcssPlugin from "prettier/plugins/postcss";

const FORMAT_CONFIG = {
    jsx: {
        parser: "babel",
        plugins: [babelPlugin, estreePlugin],
    },
    css: {
        parser: "css",
        plugins: [postcssPlugin],
    },
    tailwind: {
        parser: "babel",
        plugins: [babelPlugin, estreePlugin],
    },
};

export async function formatGeneratedCode(code, format) {
    const config = FORMAT_CONFIG[format];

    if (!config) {
        throw new Error(`Unsupported code format: ${format}`);
    }

    return prettier.format(code, {
        ...config,
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        trailingComma: "all",
    });
}
export class FormatOptions {
    enabled: boolean = true;
    indentCount: number = 4;
    useTabs: boolean = false;
    lineWidth: number = 120;
    singleQuote: boolean = true;
    linebreakMultipleAssignments: boolean = true;
    constructor() {
    }
}

export interface LintingOptions {
    luaCheckConfig: string;
    luaCheckArgs: string[];
}

export interface Settings {
    luacheckPath: string;
    perferLuacheckErrors: boolean;
    targetVersion: string;
    linting: LintingOptions;
}
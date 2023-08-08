type AppConfig = {
    port: number,
    defaultURL: string,
    promptURL: boolean,
    saveURL: boolean,
    numTaps: number
}

type Query = {
    [key: string]: string
}

//TODO properly indicate that each color must be an int from 0 to 255
type Color = [number, number, number]
interface ColorSchemeColor {
    id: string;
    name: string;
    rgb: Color;
}
interface ColorScheme {
    name: string;
    colors: Array<ColorSchemeColor>;
}

//TODO: Support empty string as key with string as value
type Option = {
    name: string;
    detail: string;
    type: "frequency" | "color" | "number" | "list" | "bool" | "button";
    value: any;
}
type FrequencyOption = Option & {
    type: "frequency";
    value: number;
}
type ColorOption = Option & {
    type: "color";
    value: Color;
}
type NumberOption = Option & {
    type: "number"
    value: number;
    min?: number;
    max?: number;
    step?: number;
}
type ListOption = Option & {
    type: "list";
    value: string;
    style?: "radio" | "dropdown";
    choices: Array<{
        id: string;
        name: string;
        detail: string;
    }>;
}
type BoolOption = Option & {
    type: "bool";
    value: boolean;
}
type ButtonOption = Option & {
    type: "button";
    value: boolean;
}
type Options = {
    ''?: string,
    [key: string]: string | FrequencyOption | ColorOption | NumberOption | ListOption | BoolOption | ButtonOption
}

type NameDescriptionList = {
    [key: string]: {
        name: string,
        description: string
    }
}

type CyclingOptions = {
    '': 'cycling',
    frontAndBack: {
        name: 'Front and back lights',
        detail: 'Front will be white, back will be a dim red',
        type: 'bool',
        value: boolean,
    },
    brake: {
        name: 'Brake light',
        detail: 'Back lights up bright red. Recommended to use with automation.',
        type: 'bool',
        value: boolean
    },
    signal: {
        name: 'Signal',
        detail: 'Turn signals and hazards',
        type: 'list',
        value: 'off' | 'left' | 'right' | 'hazards',
        choices: [
            {
                id: 'off',
                name: 'Off',
                detail: ''
            },
            {
                id: 'left',
                name: 'Left',
                detail: ''
            },
            {
                id: 'right',
                name: 'Right',
                detail: ''
            },
            {
                id: 'hazards',
                name: 'Hazards',
                detail: ''
            }
        ]
    },
    redSignal: {
        name: 'Red signal',
        detail: 'Rear signals are red rather than orange. That side\'s brake light is disabled while signaling.',
        type: 'bool',
        value: boolean
    }
}
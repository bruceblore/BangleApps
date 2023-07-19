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
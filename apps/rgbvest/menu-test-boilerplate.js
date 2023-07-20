// Code to set some predefined values to work around Bangle.http not working in web ui
let colorScheme = 'primarySecondary';
let effect = 'solid';
let interpolator = 'snap';

let colorSchemes = {
    canada: {
        name: "Canada colors",
        description: "Red. White"
    },
    christmas: {
        name: "Christmas",
        description: "Red. Yellow. Green. Blue. Orange. White"
    },
    halloween: {
        name: "Halloween",
        description: "Orange. Supposed to be purple but looks more pink"
    },
    primary: {
        name: "Primary colors",
        description: "Red. Green. Blue"
    },
    primarySecondary: {
        name: "Primary and secondary colors",
        description: "Red. Yellow. Green. Cyan. Blue. Magenta"
    },
    ubc: {
        name: "UBC school spirit",
        description: "UBC Blue. UBC Gold"
    },
    us: {
        name: "Canada colors",
        description: "Red. White. Blue"
    }
};

let effects = {
    solid: {
        name: "Solid color",
        description: "Just a solid color"
    }
};

let interpolators = {
    snap: {
        name: "Snap",
        description: "Instantly snap, no transition effect"
    }
};

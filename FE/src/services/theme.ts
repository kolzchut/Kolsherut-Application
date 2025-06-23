import {createTheme} from '@mui/material/styles';

const blue = 'rgb(69, 163, 219)';
const Cyan = 'rgb(0, 255, 255)';
const royalBlue = 'rgb(65, 105, 225)';
const black = 'rgb(34, 28, 35)';
const blackOne = 'rgb(51, 50, 49)'
const red = 'rgb(238, 37, 47)';
const lightRed = 'rgb(255, 0, 0)';
const orange = 'rgb(238, 124, 37)';
const darkOrange = 'rgb(112,72,0)';
const green = 'rgb(34, 161, 123)';
const white = 'rgb(255, 255, 255)';
const gray = 'rgb(135, 135, 135)';
const darkGrayOne= 'rgb(85, 84, 82)';
const darkGrayTwo = 'rgb(58, 52, 59)';
const darkGrayThree = 'rgb(45, 40, 46)'
const transparent = 'rgba(0, 0, 0, 0)';

const brightGreen = 'rgba(0,255,0,0.8)';
const brightRed = 'rgba(255,0,0,0.8)';
const brightPink = 'rgba(255, 0, 255, 0.8)';
const brightYellow = 'rgba(255, 255, 0, 0.8)';
const brightBlue = '#0012F0';
const brightOrange = 'rgba(255, 165, 0, 0.8)';
const brightLime = 'rgba(0,255,140,0.8)';
const lightYellow = '#FFFDF5';

const mattGreen ='#5faf76';
const mattPurple = '#895faf';
const mattBlue = '#37a1bb';
const mattYellow = '#96ad1d';
const mattPink = '#eb96da';

export const getColor = (color: string) => {
    switch (color) {
        case 'TRANSPARENT':
            return 'primary';
        case 'RED':
            return 'error';
        case 'ORANGE':
            return 'warning';
        case 'GREEN':
            return 'success';
        case 'BLUE':
            return 'info';
        case 'GRAY':
            return 'secondary';
        default:
            return undefined;
    }
};

const theme = createTheme({
    palette: {
        primary: {
            main: transparent,
        },
        secondary: {
            main: gray,
        },
        success: {
            main: green,
        },
        info: {
            main: blue,
        },
        error: {
            main: red,
        },
        warning: {
            main: orange,
        },
        background: {
            default: black,
            paper: black,
        },
    },
});

export const colorArray = [
    mattGreen,
    mattPurple,
    mattBlue,
    mattYellow,
    mattPink,
    brightGreen,
    brightRed,
    brightPink,
    brightYellow,
    brightBlue,
    brightLime,
    brightOrange,
];
export {blue,royalBlue,brightBlue, black,blackOne, red,lightRed, orange, darkOrange, green, white, gray, darkGrayOne, darkGrayTwo,darkGrayThree, transparent,lightYellow, brightYellow, Cyan};
export default theme;

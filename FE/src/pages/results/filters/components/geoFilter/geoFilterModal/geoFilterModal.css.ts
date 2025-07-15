import {createUseStyles} from 'react-jss';
import {lightBlue, lightBlueOne, lightYellow, royalBlue, white} from "../../../../../../services/theme";

export default createUseStyles({
    root: {
        position: 'relative',
        display: 'flex',
        gap: 10,
        flexDirection: 'column',
        width: '100%',
        heigh: 'fit-content',
        boxSizing: 'border-box',
        padding: '10px',
        borderRadius: 8,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        direction: 'rtl',
        background: white,
    },
    searchDiv: {
        display: 'flex',
        flexDirection: 'row',
        background: lightBlueOne,
        borderRadius: 8,
        gap: 3,
        padding: '5px',
        boxSizing: 'border-box',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        width: '70%',
        height: '30px',
        direction: 'rtl',
        fontSize: '18px',
        border: 0,
        color: lightBlue,
        padding: '5px',
        borderRadius: 4,
        background: white,
        '&:focus': {
            outline: `2px solid ${royalBlue}`,
        }
    },
    closeIcon: {
        background: "transparent",
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 15,
        '&:hover': {
            background: white,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    count: () => {
        const colorOfText = lightBlue;
        const colorOfBackground = `${lightBlue}33`;
        return ({
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1,
            color: colorOfText,
            borderRadius: 12,
            background: colorOfBackground,
            padding: '2px 6px',
        })
    },
    currentLocationDiv: {
        display: 'flex',
        fontSize: 18,
        height: '30px',
        direction: 'rtl',
        border: 0,
        padding: '5px',
        borderRadius: 4,
        background: lightBlueOne,
        fontWeight: 700,
        color: lightBlue,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        justifyContent: 'center'
    },
    locationDiv: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        direction: 'rtl',
        background: white,
        border: `1px solid transparent`,
        fontSize: '20px',
        boxSizing: 'border-box',
        fontWeight: 400,
        borderRadius: 8,
        color: lightBlue,
        padding: '10px 20px',
        '&:hover': {
            background: lightYellow,
            cursor: 'pointer',
            border: `1px solid ${lightBlueOne}`,
        }
    }
});

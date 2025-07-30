import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, secondaryBackgroundColorOne, tertiaryBackgroundColorTwo, primaryTextColorThree, primaryBackgroundColorOne} from "../../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

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
        background: primaryBackgroundColorOne,
    },
    searchDiv: {
        display: 'flex',
        flexDirection: 'row',
        background: secondaryBackgroundColorOne,
        borderRadius: 8,
        gap: 3,
        padding: '5px',
        boxSizing: 'border-box',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: ({accessibilityActive}: IProps) => ({
        width: '70%',
        height: '30px',
        direction: 'rtl',
        fontSize: accessibilityActive ? 22 : 18,
        border: 0,
        color: primaryTextColorTwo,
        padding: '5px',
        borderRadius: 4,
        background: primaryBackgroundColorOne,
        '&:focus': {
            outline: `2px solid ${primaryTextColorThree}`,
        }
    }),
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
            background: primaryBackgroundColorOne,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    count: ({accessibilityActive}: IProps) => {
        const colorOfText = primaryTextColorTwo;
        const colorOfBackground = `${primaryTextColorTwo}33`;
        return ({
            fontSize: accessibilityActive ? 22 : 18,
            fontWeight: 700,
            lineHeight: 1,
            color: colorOfText,
            borderRadius: 12,
            background: colorOfBackground,
            padding: '2px 6px',
        })
    },
    currentLocationDiv: ({accessibilityActive}: IProps) => ({
        display: 'flex',
        fontSize: accessibilityActive ? 22 : 18,
        height: '30px',
        direction: 'rtl',
        border: 0,
        padding: '5px',
        borderRadius: 4,
        background: secondaryBackgroundColorOne,
        fontWeight: 700,
        color: primaryTextColorTwo,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        justifyContent: 'center'
    }),
    locationDiv: ({accessibilityActive}: IProps) => ({
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        direction: 'rtl',
        background: primaryBackgroundColorOne,
        border: `1px solid transparent`,
        fontSize: accessibilityActive ? 24 : 20,
        boxSizing: 'border-box',
        fontWeight: 400,
        borderRadius: 8,
        color: primaryTextColorTwo,
        padding: '10px',
        gap: 6,
        cursor: 'pointer',
        '&:hover': {
            background: tertiaryBackgroundColorTwo,
        }
    }),
    border: {
        width: '100%',
        borderBottom: `1px solid ${primaryTextColorThree}`,
        margin: '5px 0'
    }
});

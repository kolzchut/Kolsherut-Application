import {createUseStyles} from 'react-jss';
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";
import {
    primaryBorderColorTwo, primaryTextColorTwo,
    secondaryBackgroundColorOne, secondaryTextColorOne,
    tertiaryBackgroundColorTwo, tertiaryTextColorFour
} from "../../../../services/theme.ts";

export default createUseStyles((theme: IDynamicThemeApp) => ({
    mainDiv: {
        width: '100%',
        height: '60px',
        display: 'flex',
        fontSize: theme?.accessibilityActive ? '26px' : '22px',
        justifyContent: 'center',
        flexDirection: 'column',
        boxSizing: 'border-box',
        padding: '10px 5px 10px 40px',
        borderRadius: '5px',
        direction: 'rtl',
        background: tertiaryBackgroundColorTwo,
        border: `2px solid ${primaryBorderColorTwo}`,
        '&:hover': {
            background: secondaryBackgroundColorOne,
            border: `2px solid ${primaryTextColorTwo}42`,
        },
    },
    bottomDiv:{
        display: 'flex',
        flexDirection: 'row',
        gap: 5
    },
    firstSentence: {
        color: secondaryTextColorOne,
        fontWeight: 600,
        fontSize: theme?.accessibilityActive ? '26px' : '22px',
        margin: 0,
    },
    secondSentence: {
        color: tertiaryTextColorFour,
        fontWeight: 400,
        fontSize: theme?.accessibilityActive ? '22px' : '18px',
        margin: 0,
    }
}));

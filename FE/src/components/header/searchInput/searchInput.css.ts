import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    primaryBorderColorTwo,
    tertiaryBackgroundColorTwo,
    primaryBackgroundColorOne
} from "../../../services/theme";
import IDynamicThemeApp from "../../../types/dynamicThemeApp.ts";

export default createUseStyles((theme: IDynamicThemeApp) => ({
    mainInputDiv: {
        flex: 14,
    },
    inputDiv: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        direction:'rtl'
    },
    searchIcon: {
        position: 'absolute',
        left: 10,
    },
    visuallyHidden: {
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
    },
    input: {
        height: 60,
        width: '100%',
        fontSize: theme?.accessibilityActive ? '26px' : '22px',
        boxSizing: 'border-box',
        padding: '10px 5px 10px 40px',
        borderRadius: '5px',
        background: tertiaryBackgroundColorTwo,
        border: `2px solid ${primaryBorderColorTwo}`,
        '&:hover': {
            background: secondaryBackgroundColorOne,
            border: `2px solid ${primaryTextColorTwo}42`,
        },
        '&:focus': {
            background: secondaryBackgroundColorOne,
            border: `2px solid ${primaryTextColorTwo}`,
            outline: 'none'
        }
    },
    searchOptionsDiv: {
        position: 'absolute',
        width: theme?.isMobile ? '100%' : '66%',
        top: 80,
        right: theme?.isMobile ? '0' : 'unset',
        boxSizing: 'border-box',
        padding: '10px',
        borderBottomLeftRadius: '5px',
        borderBottomRightRadius: '5px',
        background: primaryBackgroundColorOne,
    }
}));

import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    primaryBorderColorTwo,
    tertiaryBackgroundColorTwo,
    primaryBackgroundColorOne
} from "../../../services/theme";

interface IProps {
    isMobile: boolean,
    accessibilityActive: boolean
}

export default createUseStyles({
    root: {
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
    input: ({accessibilityActive}: IProps) => {
        const firstBackground = tertiaryBackgroundColorTwo;
        const firstBorderColor = primaryBorderColorTwo;
        const secondBackground = secondaryBackgroundColorOne;
        const secondBorderColor = primaryTextColorTwo + '42';
        return ({
            height: "100%",
            width: '100%',
            fontSize: accessibilityActive ? '26px' : '22px',
            boxSizing: 'border-box',
            padding: '10px 5px 10px 40px',
            borderRadius: '5px',
            background: firstBackground,
            border: `2px solid ${firstBorderColor}`,
            '&:hover': {
                background: secondBackground,
                border: `2px solid ${secondBorderColor}`,
            },
            '&:focus': {
                background: secondBackground,
                border: `2px solid ${primaryTextColorTwo}`,
                outline: 'none'
            }
        })
    },
    searchOptionsDiv: ({isMobile}: IProps) => {
        const style = {
            position: 'absolute',
            width:'66%',
            top: 80,
            right: 'unset',
            boxSizing: 'border-box',
            padding: '10px',
            borderBottomLeftRadius: '5px',
            borderBottomRightRadius: '5px',
            background: primaryBackgroundColorOne,
        }
        if(isMobile) {
            style.width = '100%';
            style.right = '0';
        }
        return style;
    }
});

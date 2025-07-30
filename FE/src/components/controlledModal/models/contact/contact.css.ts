import {createUseStyles} from 'react-jss';
import {secondaryBackgroundColorOne, primaryBackgroundColorOne} from "../../../../services/theme";

interface IProps {
    isMobile: boolean,
    accessibilityActive: boolean
}

export default createUseStyles({
    root: ({isMobile}: IProps) => {
        const style = {
            position: 'relative',
            display: 'flex',
            gap: 10,
            flexDirection: 'column',
            height: 'fit-content',
            width: 'fit-content',
            boxSizing: 'border-box',
            padding: '20px 40px',
            borderRadius: 8,
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            direction: 'rtl',
            background: primaryBackgroundColorOne
        };
        if (isMobile) {
            style.width = '100%';
            style.height = "100%";
            style.boxSizing = 'border-box';
        }
        return style
    },
    closeIcon: {
        background: "transparent",
        position: "absolute",
        top: 10,
        left: 10,
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 15,
        '&:hover': {
            background: secondaryBackgroundColorOne,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    text: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 22 : 18,
        fontWeight: 300
    })
});

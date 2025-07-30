import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorTwo,
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    primaryBackgroundColorOne
} from "../../../../services/theme";

export default createUseStyles({
    root: ({isMobile}: { isMobile: boolean, accessibilityActive: boolean }) => {
        const style = {
            position: 'relative',
            display: 'flex',
            gap: 10,
            flexDirection: 'column',
            height: 'unset',
            width: 'unset',
            boxSizing: 'border-box',
            padding: '20px 40px',
            borderRadius: 8,
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            direction: 'rtl',
            background: primaryBackgroundColorOne,
        }
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
    header: {
        marginBottom: 20
    },
    title: ({ accessibilityActive }: { accessibilityActive: boolean }) => ({
        fontSize: accessibilityActive ? '32px' : '28px',
        fontWeight: 600,
        color: secondaryTextColorTwo
    }),
    subtitle: ({ accessibilityActive }: { accessibilityActive: boolean }) => ({
        fontSize: accessibilityActive ? '26px' : '22px',
        fontWeight: 400,
        margin: '10px 0',
        color: secondaryTextColorTwo
    }),
    button: ({ accessibilityActive }: { accessibilityActive: boolean }) => ({
        width: '100%',
        fontSize: accessibilityActive ? '20px' : '16px',
        height: '40px',
        borderRadius: '20px',
        background: primaryTextColorTwo,
        color: primaryBackgroundColorOne,
        '&:hover': {
            cursor: 'pointer',
        }
    })
});

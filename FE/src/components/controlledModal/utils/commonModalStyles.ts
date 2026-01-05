import {
    secondaryBackgroundColorOne,
    primaryBackgroundColorOne,
    secondaryTextColorTwo
} from "../../../services/theme";

export const getModalRootStyle = ({isMobile}: { isMobile: boolean }, width: string = '100%') => {
    const style = {
        position: 'relative',
        display: 'flex',
        gap: 10,
        flexDirection: 'column',
        height: 'fit-content',
        maxHeight: '100%',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        width: width,
        boxSizing: 'border-box',
        padding: '20px 40px',
        borderRadius: 8,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        direction: 'rtl',
        background: primaryBackgroundColorOne,
    };
    if (isMobile) {
        style.borderRadius = 0;
        style.width = '100%';
        style.height = "100%";
        style.boxSizing = 'border-box';
    }
    return style;
};

export const modalCloseIconStyle = {
    background: "transparent",
    position: "absolute",
    top: 35,
    left: 35,
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
};

export const modalTitleStyle = ({accessibilityActive}: { accessibilityActive: boolean }) => ({
    fontSize: accessibilityActive ? '32px' : '28px',
    fontWeight: 600,
    color: secondaryTextColorTwo
});

export const modalSubtitleStyle = ({accessibilityActive}: { accessibilityActive: boolean }) => ({
    fontSize: accessibilityActive ? '26px' : '22px',
    fontWeight: 400,
    margin: '10px 0',
    color: secondaryTextColorTwo
});

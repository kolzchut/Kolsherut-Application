import {createUseStyles} from 'react-jss';
import {primaryTextColorOne, secondaryBackgroundColorTwo, tertiaryTextColorOne, tertiaryTextColorThree} from "../../../../../services/theme";
import ArrowDirection from "./arrowDirectionEnum";

interface IProps {
    arrow: ArrowDirection;
    accessibilityActive: boolean;
}

export default createUseStyles({
    title: ({accessibilityActive}: IProps) => ({
        color: tertiaryTextColorOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 20 : 16
    }),
    mainDiv:()=> {
        const halfTransparentBrightBlue = `${primaryTextColorOne}40`;
        return({
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '10px',
            boxSizing: 'border-box',
            backgroundColor: secondaryBackgroundColorTwo,
            borderRadius: 10,
            border: `1px solid ${halfTransparentBrightBlue}`
        })},
    link: ({accessibilityActive}: IProps) => ({
        cursor: 'pointer',
        width: 'calc(100% - 30px)',
        display: 'inline-block',
        paddingLeft: '18px',
        fontWeight: 600,
        fontSize: accessibilityActive ? '20px' : '16px',
        lineHeight: 1.25,
        height: 'fit-content',
        color: primaryTextColorOne,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline',
        }
    }),
    linkIcon: {
        height: '16px'
    },
    hiddenLinksDiv: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
    },
    hiddenLinks: ({accessibilityActive}: IProps) => ({
        display: 'flex',
        gap: 5,
        color: tertiaryTextColorThree,
        fontWeight: 400,
        lineHeight: 1,
        fontSize: accessibilityActive ? '20px' : '16px'
    }),
    arrow: ({arrow}: IProps) => ({
        height: '16px',
        width: '16px',
        position: 'absolute',
        top: 'calc(50% - 8px)',
        left: '10px',
        transform: arrow === ArrowDirection.Close ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 0.3s ease-in-out',
    }),
});

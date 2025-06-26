import {createUseStyles} from 'react-jss';
import {brightBlue, brightBlueOne, darkGrayOne, lightGray} from "../../../../../services/theme";
import ArrowDirection from "./arrowDirectionEnum";

export default createUseStyles({
    title: {
        color: darkGrayOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize:16
    },
    mainDiv:()=> {
        const halfTransparentBrightBlue = `${brightBlue}40`;
        return({
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '10px',
            boxSizing: 'border-box',
            backgroundColor: brightBlueOne,
            borderRadius: 10,
            border: `1px solid ${halfTransparentBrightBlue}`
        })},
    link: {
        cursor: 'pointer',
        width: 'calc(100% - 30px)',
        display: 'inline-block',
        paddingLeft: '18px',
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: 1.25,
        height: 'fit-content',
        color: brightBlue,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline',
        }
    },
    linkIcon: {
        height: '16px'
    },
    hiddenLinksDiv: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4
    },
    hiddenLinks: {
        display: 'flex',
        gap: 5,
        color: lightGray,
        fontWeight: 400,
        lineHeight: 1,
        fontSize: '16px'
    },
    arrow: ({arrow}: { arrow: ArrowDirection }) => ({
        height: '16px',
        width: '16px',
        position: 'absolute',
        top: 'calc(50% - 8px)',
        left: '10px',
        transform: arrow === ArrowDirection.Close ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 0.3s ease-in-out',
    }),
});

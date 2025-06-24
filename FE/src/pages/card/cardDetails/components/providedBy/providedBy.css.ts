import {createUseStyles} from 'react-jss';
import {brightBlue, brightBlueOne, darkGrayOne} from "../../../../../services/theme";
import ArrowDirection from "./arrowDirectionEnum";
export default createUseStyles({
    title: {
        color: darkGrayOne,
        fontWeight:600,
        lineHeight: '21px',
        fontSize:16
    },
    mainDiv: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '10px',
        boxSizing: 'border-box',
        backgroundColor: brightBlueOne,
        borderRadius: 10,
        border: `1px solid ${brightBlue}40` // Adding a semi-transparent border
    },
    link: {
        cursor: 'pointer',
        width:'fit-content',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '18px',
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: '20px',
        height: '20px',
        color: brightBlue,
        textDecoration: 'none',
        '&:hover': {
            textDecoration: 'underline',
        }
    },
    linkIcon:{
        height: '60%'
    },
    arrow: ({ arrow }: {arrow:ArrowDirection}) => ({
        height: '16px',
        width: '16px',
        position: 'absolute',
        top: 'calc(50% - 8px)',
        left: '10px',
        transform: arrow === ArrowDirection.Close ? 'rotate(0deg)':  'rotate(180deg)',
        transition: 'transform 0.3s ease-in-out',
    }),
});

import {createUseStyles} from 'react-jss';
import {black, brightBlue, brightBlueOne} from "../../../../../services/theme";


export default createUseStyles({
    root: () => {
        const halfTransparentBrightBlue = `${brightBlue}40`;
        return ({
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            padding: '10px',
            boxSizing: 'border-box',
            backgroundColor: brightBlueOne,
            borderRadius: 10,
            border: `1px solid ${halfTransparentBrightBlue}`
        })
    },
    arrow: ({isExtendedBox}: { isExtendedBox: boolean }) => ({
        height: '25px',
        width: '25px',
        position: 'absolute',
        top: 'calc(50% - 8px)',
        left: '10px',
        transform: isExtendedBox ? 'rotate(0deg)' : 'rotate(180deg)',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
            cursor: 'pointer',
            opacity: 0.8
        }
    }),
    openDiv: {
        marginTop:15,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 30,
        boxSizing: 'border-box',
        gap: 10,
    },
    title: {
        fontWeight: 600,
        lineHeight: 1.3,
        fontSize: 20,
        margin: 0,
        color: brightBlue,
        width:'80%'
    },
    subtitle:{
        fontWeight: 600,
        lineHeight: 1.3,
        fontSize: 18,
        margin:0,
        color: black
    },
    paragraph:{
        fontWeight: 300,
        lineHeight: 1.3,
        fontSize: 16,
        margin:0,
        color: black
    },
    link:{
        display:'flex',
        width:'fit-content',
        '&:hover': {
            cursor:'pointer'
        }
    }
});


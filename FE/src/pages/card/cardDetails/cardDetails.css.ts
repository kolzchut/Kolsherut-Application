import {createUseStyles} from 'react-jss';
import {blackOne, darkGrayOne} from "../../../services/theme";

export default createUseStyles({
    root: {
        position: "relative",
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        fontFamily: "RAG SANS ,Arial, sans-serif",
        flex:2,
        overflowY: 'auto',
        boxShadow: '-2px 0 15px rgba(0, 0, 0, 0.5)',
        zIndex: 0,
        direction:'rtl',
        scrollbarWidth: 'none',
    },
    content:{
        display: 'flex',
        flexDirection:'column',
        width: '100%',
        boxSizing: 'border-box',
        padding: '16px 56px',
        gap:'16px',
        '@media (max-width: 768px)': {
            padding: '8px 16px'
        }
        },
    serviceNameText:{
        fontSize: '24px',
        margin:0,
        lineHeight:1.15,
        color: blackOne,
        fontWeight: 600,
    },
    branchNameText:{
        fontWeight:400,
        fontSize: '20px',
        lineHeight: 1.4,
        color: darkGrayOne,
        margin:0
    },
    serviceDescriptionText: {
        margin:0,
        fontSize: 16,
        fontWeight: 300,
        lineHeight: 1.5,
        color: blackOne
    },
    quickActionContainer: {
        position: 'sticky',
        bottom: 0,
        width: '100%',
        backgroundColor: 'white',
        boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.3s ease-in-out',
    },
    hidden: {
        transform: 'translateY(100%) scaleY(0)',
    },
});

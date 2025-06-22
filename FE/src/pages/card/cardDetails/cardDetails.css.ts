import {createUseStyles} from 'react-jss';
import {blackOne} from "../../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        fontFamily: "RAG SANS ,Arial , Helvetica , sans-serif",
        flex:2,
        overflowY: 'auto',
        boxShadow: '-2px 0 15px rgba(0, 0, 0, 0.5)',
        zIndex: 0,
        direction:'rtl',
        scrollbarWidth: 'none',
    },
    content:{
        width: '100%',
        boxSizing: 'border-box',
        padding: '16px 56px',
    },
    serviceNameText:{
        fontSize: '24px',
        lineHeight:'28px',
        color: blackOne,
        fontWeight: 600,
    },
    serviceDescriptionText: {
        fontSize: 16,
        fontWeight: 300,
        lineHeight: '24px',
        color: blackOne
    }
});
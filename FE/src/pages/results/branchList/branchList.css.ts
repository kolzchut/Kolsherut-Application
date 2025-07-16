import {createUseStyles} from 'react-jss';
import {primaryBackgroundColorOne} from "../../../services/theme";

export default createUseStyles({
    mainDiv:({distanceFromTop, isMobile}:{distanceFromTop:number, isMobile:boolean})=>({
        width:'100%',
        boxSizing: 'border-box',
        position:'absolute',
        padding:10,
        top: !isMobile ? distanceFromTop: 0,
    }),
    title: {
        width: '100%',
        height: 60,
        boxSizing: 'border-box',
        backgroundColor:primaryBackgroundColorOne,
        padding: '0 20px',
        fontSize: 19,
        fontWeight: 700,
        borderBottom: '3px solid #E1DEDB',
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeIcon:{
        height: '25px',
        '&:hover': {
            cursor: 'pointer',
            opacity: 0.8,
        }
    },
    branchList:{
        width: '100%',
        backgroundColor:primaryBackgroundColorOne,
        maxHeight:'calc(100vh - 60px)',
        overflowY: 'auto',
    }
});

import {createUseStyles} from 'react-jss';
import {brightBlue, gray, lightYellow, white} from "../../../../../services/theme";


const aTagGeneralStyle = {
    display: 'flex',
    alignItems: 'center',
    paddingRight: '10px',
    paddingLeft: '20px',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '10px',
    borderRadius: '10px',
    height: '40px',
    flex: 1,
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s, box-shadow 0.2s',

    '&:hover': {
        boxShadow: '0 2px 7px rgba(0, 0, 0, 0.4)',
    },
    '&:focus': {
        outline: '2px solid #007BFF',
        outlineOffset: '2px',
    },
    '@media (max-width: 768px)': {
        fontSize: '14px',
        gap: '4px',
    }
}


export default createUseStyles({
    mainDiv:{
        width: '100%',
        display: 'flex',
        flexDirection:'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        height:'56px',
        gap: '8px',
        boxSizing: 'border-box',
        backgroundColor: lightYellow,
        '@media (max-width: 768px)': {
            padding: '8px 12px',
            gap: '4px',
        }
    },
    aTagTel:{
        ...aTagGeneralStyle,
        border: 'none',
        backgroundColor: brightBlue ,
        color:  white,
        flex: 3,
        '@media (max-width: 768px)': {
            flex:4
        }
    },
    aTagGeneral:{
        ...aTagGeneralStyle,
        border:`1px solid ${gray}`,
        backgroundColor: white,
        color: brightBlue,
        flex:2
    },
    aTagImage:{
        height:'60%'
    },

});

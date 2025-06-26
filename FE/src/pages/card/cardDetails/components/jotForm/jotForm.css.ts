import {createUseStyles} from 'react-jss';
import {darkGrayTwo, gray, white} from "../../../../../services/theme";

export default createUseStyles({
    aTag:{
        width: '100%',
        border: `1px solid ${gray}`,
        textDecoration: 'none',
        height: '48px',
        background:white,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: "center",
        gap: '4px'
    },
    title:{
        fontSize:16,
        fontWeight: 300,
        lineHeight: 1,
        color: darkGrayTwo
    }
});

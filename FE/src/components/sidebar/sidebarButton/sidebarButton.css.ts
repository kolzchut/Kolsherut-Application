import {createUseStyles} from 'react-jss';
import { primaryBorderColorOne} from "../../../services/theme";

export default createUseStyles({
    mainDiv:{
        width:'100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        padding: '20px',
        fontSize:'24px',
        borderTop: `1px solid ${primaryBorderColorOne}`,
    }
});


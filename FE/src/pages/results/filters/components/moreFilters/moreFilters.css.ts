import {createUseStyles} from 'react-jss';
import {lightBlue, royalBlue, lightBlueOne} from "../../../../../services/theme";

export default createUseStyles({
    button:{
        width: '100%',
        height:30,
        borderRadius: 3,
        color: lightBlue,
        fontSize: 16,
        backgroundColor: 'transparent',
        border: `1px solid ${royalBlue}`,
        '&:hover':{
            backgroundColor: lightBlueOne,
            cursor: 'pointer',
        }
    }
});

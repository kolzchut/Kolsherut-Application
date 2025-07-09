import {createUseStyles} from 'react-jss';
import {black, brightMattYellow, lightBlueOne} from "../../services/theme";

export default createUseStyles({
    root:{
        width:'fit-content',
        height:'fit-content',
        fontSize: '18px',
        gap: 3,
        color:black,
        fontWeight: 300,
        padding: 3,
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius:3,
        textDecoration:'none',
        '&:hover': {
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 500,

        }
    },
    icon:{
        height:'18px'
    },
    justiceLink:{
        background: lightBlueOne,
    },
    digitalLink:{
        background: lightBlueOne,
    },
    kzLink:{
        background:brightMattYellow,
    }

});

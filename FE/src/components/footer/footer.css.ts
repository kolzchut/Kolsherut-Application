import {createUseStyles} from 'react-jss';
import {blackOne} from "../../services/theme";

export default  createUseStyles({
    disclaimer:{
        direction:'rtl',
        padding: "32px 56px",
        '@media (max-width: 768px)': {
            padding: '24px 16px'
        }
    },
    firstParagraph:{
        fontSize:16,
        lineHeight: 1.25,
        fontWeight: 300,
        color:blackOne
    },
    bolder:{
        fontWeight: 700
    },
    secondAndThirdParagraphs:{
        fontSize:13,
        lineHeight: 1.25,
        fontWeight: 300,
        color: blackOne
    },
    icons:{
        height:13
    }
});

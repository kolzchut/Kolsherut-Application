import {createUseStyles} from 'react-jss';
import {blackOne} from "../../services/theme";

export default  createUseStyles({
    disclaimer:{
        padding: "32px 56px"
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

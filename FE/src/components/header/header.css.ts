import {createUseStyles} from 'react-jss';
import {lightBlue, royalBlue} from "../../services/theme";

export default  createUseStyles({
    root:{
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        height: 80,
        color: lightBlue,
        justifyContent: 'space-around',
    },
    links:{
        background:royalBlue,
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        lineHeight: 4,
        fontSize: 20
    }
});

import {createUseStyles} from 'react-jss';
import {white} from "../../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        fontFamily: 'RAG Sans, sans-serif',
        justifyContent: "center",
        gap: 20,
        padding: 20,
        backgroundColor: white,
        borderRadius: 10,
        direction: 'rtl'
    },
});

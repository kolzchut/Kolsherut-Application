import {createUseStyles} from 'react-jss';
import {primaryBackgroundColorOne} from "../../../services/theme";

export default createUseStyles({
    root:()=> ({
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        fontFamily: 'RAG Sans, sans-serif',
        justifyContent: "center",
        alignContent: 'flex-start',
        gap: 40,
        padding: 20,
        backgroundColor: primaryBackgroundColorOne,
        borderRadius: 10,
        direction: 'rtl',
        width: '100%',
        boxSizing: 'border-box',
    }),
});

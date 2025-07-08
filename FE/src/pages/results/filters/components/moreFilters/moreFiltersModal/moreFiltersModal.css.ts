import {createUseStyles} from 'react-jss';
import {brightBlue, lightBlue, white} from "../../../../../../services/theme";

export default createUseStyles({
    mainDiv: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: white,
        borderRadius: 10,
        padding: 20,
        boxSizing: "border-box",
        justifyContent: "space-between",
    },
    innerDiv:{
        height: 'calc(100% - 50px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    applyButton:{
        background: lightBlue,
        color: white,
        fontWeight: 700,
        borderRadius: 15,
        height:30,
        fontSize: 16,
        border:0,
        transition: "background 0.5s ease",
        "&:hover": {
            background: brightBlue,
            cursor: "pointer",
        }
    }
});

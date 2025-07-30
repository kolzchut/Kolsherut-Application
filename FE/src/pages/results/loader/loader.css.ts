import {createUseStyles} from 'react-jss';
import { primaryBackgroundColorTwo} from "../../../services/theme.ts";

export default createUseStyles({
    root: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        width: '100%',
        height: 175,
        margin: '10px 0',
        borderRadius:10,
        backgroundColor: primaryBackgroundColorTwo,
        position: "relative",
        overflow: "hidden",
        "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            height: "100%",
            width: "100%",
            background: "linear-gradient(to left, transparent, rgba(255,255,255,0.4), transparent)",
            animation: "$shine 1.2s infinite",
        },
    },
    "@keyframes shine": {
        "0%": {right: "-100%"},
        "100%": {right: "100%"},
    },
});

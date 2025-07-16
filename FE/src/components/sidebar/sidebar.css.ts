import {createUseStyles} from 'react-jss';
import {secondaryBackgroundColorOne, primaryBackgroundColorOne} from "../../services/theme";

export default createUseStyles({
    modalBackground: {
        overflowY: 'hidden',
        position: "fixed",
        left: 0,
        top: 0,
        overflow: "auto",
        backgroundColor: "#00000067",
        width: "100%",
        height: "100%",
        zIndex: 1,
        display: "flex",
        direction:'rtl',
        justifyContent: "flex-start",
        alignItems: "center",
    },
    modalContent:{
        width: '70vw',
        height: '100vh',
        position:'relative',
        zIndex: 2,
        background: primaryBackgroundColorOne,
    },
    closeIcon: {
        background: "transparent",
        position: "absolute",
        top: 10,
        left: 10,
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 15,
        '&:hover': {
            background: secondaryBackgroundColorOne,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    logo:{
        height:'40px',
        paddingTop:'40px',
        paddingRight:'20px',
        paddingBottom:'20px',
    }
});


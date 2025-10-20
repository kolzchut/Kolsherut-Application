import {createUseStyles} from 'react-jss';
import {secondaryBackgroundColorOne, primaryBackgroundColorOne} from "../../services/theme";

const buttonStyles = {
    height: 40,
    marginTop:20,
    padding: 5,
    cursor: "pointer",
    borderRadius: 30,
    border: 'none',
    boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.3)',
}
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
        direction: 'rtl',
        justifyContent: "flex-start",
        alignItems: "center",
    },
    modalContent: {
        width: '70vw',
        height: '100dvh',
        position: 'relative',
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
    logo: {
        height: '40px',
        paddingTop: '40px',
        paddingBottom: '20px',
    },
    logoAndAccessDiv: {
        display: "flex",
        justifyContent: "space-between",
        padding: "0 20px",
        alignItems: "center"
    },
    button: {
        ...buttonStyles,
        background: "transparent",
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
    },
    accessibilityButton: {
        ...buttonStyles,
        background: '#208Ff3',
        boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.6)',
    },
});


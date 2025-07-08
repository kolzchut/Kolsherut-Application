import {createUseStyles} from 'react-jss';

export default createUseStyles({
    modalBackground: {
        position: "fixed",
        left: 0,
        top: 0,
        overflow: "auto",
        backgroundColor: "#00000067",
        width: "100%",
        height: "100%",
        zIndex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width:'50%',
        height:'70%',
        zIndex: 2,
    },
});


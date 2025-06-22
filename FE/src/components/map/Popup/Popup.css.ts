import {createUseStyles} from "react-jss";

export default createUseStyles({
    popup: {
        backgroundColor: 'white',
        padding: '5px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        minWidth: '100px',
        zIndex: 1000,
        pointerEvents: 'none',
        position: 'absolute',
        whiteSpace: 'nowrap',
    },
});

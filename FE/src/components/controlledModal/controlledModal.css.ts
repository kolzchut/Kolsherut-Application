import {createUseStyles} from 'react-jss';

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
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: ({isMobile}: { isMobile: boolean }) => {
        if (!isMobile)
            return ({
                width: '50vw',
                height: '70vh',
                zIndex: 2,
            })
        return ({
            width: '90vw',
            height: '90vh',
            zIndex: 2,
        })

    },
});


import {createUseStyles} from 'react-jss';
import {royalBlue} from "../../../services/theme";

export default createUseStyles({
    root: ({isMobile}: { isMobile: boolean }) => {
        if(!isMobile) return ({
            display: 'flex',
            flexDirection: 'column',
            width: '17%',
            padding: 10,
            minWidth: '300px',
            direction: "rtl",
            gap: 15,
        })
        return ({
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            padding: '0px 5px',
            height: 50,
            boxSizing:'border-box',
            alignItems:"center",
            justifyContent: "space-between",
            direction: "rtl",
            gap: 15,
            borderBottom: `1px solid ${royalBlue}`,
        })
    }
});

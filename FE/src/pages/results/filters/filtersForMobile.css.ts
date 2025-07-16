import {createUseStyles} from 'react-jss';
import {primaryTextColorThree} from "../../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'column-reverse',
        width: '100%',
        padding: '0px 5px',
        height: "fit-content",
        boxSizing: 'border-box',
        justifyContent: "space-between",
        direction: "rtl",
        borderBottom: `1px solid ${primaryTextColorThree}`,
    },
    filtersContainer: {
        display:'inline-flex',
        flexDirection:"row",
        height: 30,
        gap: 5,
        overflowX: 'auto',
        padding: '5px',
        alignItems:'center',
    }
});

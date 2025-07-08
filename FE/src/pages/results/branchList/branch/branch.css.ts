import {createUseStyles} from 'react-jss';
import {black, darkGrayOne, lightGrayOne} from "../../../../services/theme";

export default createUseStyles({
    mainDiv: {
        width: '100%',
        border: `1px solid ${lightGrayOne}`,
        borderRadius: '4px',
        textDecoration: 'none',
        padding: 12,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color .3s, border-color .3s',
        '&:hover': {
            borderColor: '#dae5fe',
            cursor: 'pointer'
        }
    },
    textDiv: {
        display: "flex",
        flexDirection: 'column',
    },
    branchName: {
        color: black,
        fontWeight: 400,
        fontSize: 14,
    },
    branchAddress: {
        color: darkGrayOne,
        fontWeight: 400,
        fontSize: 12,
    },
    nationalBranch: {
        fontWeight: 700,
        color: darkGrayOne,
        fontSize: 14,
    },
    icon:{
        height:'18px'
    }
});

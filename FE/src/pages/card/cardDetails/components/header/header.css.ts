import {createUseStyles} from 'react-jss';
import {darkGrayOne, lightYellow, royalBlue} from "../../../../../services/theme";

export default createUseStyles({
    header:{
        boxSizing: 'border-box',
        padding: 20,
        width: '100%',
        backgroundColor: lightYellow,
        boxShadow: "0 4px 8px #0000001a",
        fontSize: 16,
        color: darkGrayOne,
        display: 'flex',
        flexDirection: 'column',
    },
    headerTitle: {
        fontWeight: 600
    },
    headerSubtitle: {
        fontWeight: 300
    },
    nationWideText:{
      color: royalBlue,
        fontWeight: 600
    }
});

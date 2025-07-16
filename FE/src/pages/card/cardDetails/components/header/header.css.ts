import {createUseStyles} from 'react-jss';
import {tertiaryTextColorOne, tertiaryBackgroundColorTwo, primaryTextColorThree} from "../../../../../services/theme";

export default createUseStyles({
    header:{
        boxSizing: 'border-box',
        padding: 20,
        width: '100%',
        backgroundColor: tertiaryBackgroundColorTwo,
        boxShadow: "0 4px 8px #0000001a",
        fontSize: 16,
        color: tertiaryTextColorOne,
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
      color: primaryTextColorThree,
        fontWeight: 600
    }
});

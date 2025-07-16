import {blackOne, royalBlue, white} from "../../../../services/theme.ts";
import {createUseStyles} from "react-jss";

export default createUseStyles({
    group: {
        width: 350,
        display: 'flex',
        flexDirection: 'column',

    },
    groupTitle: {
        fontSize: 22,
        fontWeight: 500,
        color: blackOne,
        paddingRight: 10,
        margin: 0,
    },
    optionalSearchValuesWrapper: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        backgroundColor: white,
        borderRadius: 10,
        padding: 10,
    },
    groupLinkDiv: {
        display:"flex",
        alignItems:"center",
        height:'fit-content',
        width:"100%",
        color:royalBlue,
        "&:hover": {
            cursor:"pointer",
        }
    }
});

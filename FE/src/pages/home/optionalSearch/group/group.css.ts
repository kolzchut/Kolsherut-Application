import {secondaryTextColorTwo, primaryTextColorThree} from "../../../../services/theme";
import {createUseStyles} from "react-jss";

export default createUseStyles({
    group: ({wrapColor, showBorder}: { wrapColor: string, showBorder:boolean }) => {
        const backgroundColor = `${wrapColor}20`;
        const borderColor = `${wrapColor}FF`;
        const style = {
            width: 350,
            display: 'flex',
            flexDirection: 'column',
            borderRadius:10,
            backgroundColor: 'unset',
            border: 'unset',

        };
        if(showBorder) {
            style.backgroundColor = backgroundColor;
            style.border= `3px solid ${borderColor}`;
        }
        return style;
    },
    groupTitle: {
        fontSize: 22,
        fontWeight: 500,
        color: secondaryTextColorTwo,
        paddingRight: 10,
        margin: 0,
    },
    optionalSearchValuesWrapper: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        borderRadius: 10,
        padding: 10,
    },
    groupLinkDiv: {
        display: "flex",
        alignItems: "center",
        height: 'fit-content',
        width: "100%",
        color: primaryTextColorThree,
        "&:hover": {
            cursor: "pointer",
        }
    }
});

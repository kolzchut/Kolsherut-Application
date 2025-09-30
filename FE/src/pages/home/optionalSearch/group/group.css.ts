import {secondaryTextColorTwo, primaryTextColorThree} from "../../../../services/theme";
import {createUseStyles} from "react-jss";

interface IProps {
    wrapColor: string;
    showBorder: boolean;
    accessibilityActive: boolean;
}

export default createUseStyles({
    group: ({wrapColor, showBorder}: IProps) => {
        const backgroundColor = `${wrapColor}20`;
        const borderColor = `${wrapColor}FF`;
        const style = {
            width: 350,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 10,
            backgroundColor: 'unset',
            border: 'unset',
            boxSizing: 'unset',
            padding: 0,
            margin: 'unset',
        };
        if (showBorder) {
            style.backgroundColor = backgroundColor;
            style.border = `3px solid ${borderColor}`;
            style.boxSizing = 'content-box'
            style.padding = 10;
            style.margin = '-10px';
        }
        return style;
    },
    groupTitle: ({ accessibilityActive }: IProps) => ({
        fontSize: accessibilityActive ? 26 : 22,
        fontWeight: 500,
        color: secondaryTextColorTwo,
        paddingRight: 10,
        margin: 0,
        display:"flex",
        alignItems: "center",
    }),
    optionalSearchValuesWrapper: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        borderRadius: 10,
        padding: 10,
    },
    groupLinkDiv: ({ accessibilityActive }: IProps)=>({
        display: "flex",
        alignItems: "center",
        height: 'fit-content',
        width: "100%",
        fontSize: accessibilityActive ? 20: 16,
        color: primaryTextColorThree,
        "&:hover": {
            cursor: "pointer",
        }
    }),
    icon: {
        scale:1.5,
        marginRight:15,
        top:10,
    },
    linkIcon:{
        width:'16px',
        height:'16px'
    }
});

import {createUseStyles} from 'react-jss';

interface IProps {
    color: string;
    isResponse: boolean;
    accessibilityActive: boolean;
}

export default createUseStyles({
    container:{
        display:"flex",
        flexDirection: "row",
        height:"fit-content",
        alignItems:'center',
        margin: 10
    },
    label: ({color, accessibilityActive}: IProps) =>{
        const backgroundColor = `${color}10`;
        const borderColor = `${color}80`;
        const hoverBackgroundColor = `${color}30`;
        const hoverBorderColor = `${color}90`;
        return ({
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: backgroundColor,
            textDecoration: 'none',
            padding: '4px 8px 4px 0px',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            width: 'fit-content',
            margin: 0,
            fontSize: accessibilityActive ? 18 : 14,
            '&:hover': {
                backgroundColor: hoverBackgroundColor,
                borderColor: hoverBorderColor,
            }
        })
    },
    dot: ({color}: IProps) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        display: 'inline-block',
    }),
    linkIcon: ({isResponse}: IProps) => ({
        width: 14,
        height: 14,
        marginLeft: 4,
        filter: isResponse ? 'brightness(50%) saturate(100%)' : 'none',
    }),
    situationLinkIcon: {
        width: 16,
        height: 16,
    },
    extra: ({color, accessibilityActive}: IProps) =>{
        const backgroundColor = `${color}10`;
        const borderColor = `${color}80`;
        return ({
            backgroundColor: backgroundColor,
            borderTop: `1px solid ${borderColor}`,
            borderLeft: `1px solid ${borderColor}`,
            borderBottom: `1px solid ${borderColor}`,
            padding: '4px 2px',
            fontSize: accessibilityActive ? 18 : 14,
            borderRadius: '4px 0px 0px 4px',
        })
    }
});

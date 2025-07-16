import {createUseStyles} from 'react-jss';

export default createUseStyles({
    container: {
        display: "flex",
        height:'100%',
        flexDirection: "row",
        alignItems: 'center',
        width:'fit-content',
        margin: 0,
    },
    label: ({color, isSelected}: { color: string, isSelected: boolean}) => {
        const backgroundColor = `${color}10`;
        const borderColor = `${color}80`;
        const selectOrHoverBackgroundColor = `${color}30`;
        const selectOrHoverBorderColor = `${color}90`;
        return ({
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor:isSelected? selectOrHoverBackgroundColor :backgroundColor,
            textDecoration: 'none',
            padding: '4px 8px 4px 0px',
            boxSizing:'border-box',
            height:'100%',
            border: isSelected ? `1px solid ${selectOrHoverBorderColor}` : `1px solid ${borderColor}`,
            borderRadius: 4,
            width: 'fit-content',
            margin: 0,
            fontSize: 16,
            fontWeight: 500,
            whiteSpace: 'nowrap',
        })
    },
    dot: ({color}: { color: string }) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        display: 'inline-block',
    }),
    cancelOrAdd: ({isSelected}: {color:string, isSelected:boolean})=>({
        width: 14,
        height: 14,
        marginLeft: 4,
        filter:  'brightness(50%) saturate(100%)',
        transform: isSelected ? 'rotate(0deg)' : 'rotate(45deg)',
        transition: 'transform 0.2s ease',
    }),
});

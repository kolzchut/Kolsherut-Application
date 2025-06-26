import {createUseStyles} from 'react-jss';

export default createUseStyles({
    label: ({color}: { color: string; isResponse: boolean }) =>{
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
            padding: '4px 8px',
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            width: 'fit-content',
            margin: 8,
            fontSize: 14,
            '&:hover': {
                backgroundColor: hoverBackgroundColor,
                borderColor: hoverBorderColor,
            }
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
    linkIcon: ({isResponse}: {color: string; isResponse: boolean}) => ({
        width: 14,
        height: 14,
        marginLeft: 4,
        filter: isResponse ? 'brightness(50%) saturate(100%)' : 'none',
    }),
    situationLinkIcon: {
        width: 16,
        height: 16,
    }
});

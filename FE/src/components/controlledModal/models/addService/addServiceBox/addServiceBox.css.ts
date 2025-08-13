import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorOne,
    primaryTextColorOne,
    secondaryBackgroundColorTwo,
    primaryBackgroundColorOne
} from "../../../../../services/theme";

interface IProps {
    isExtendedBox: boolean;
    accessibilityActive: boolean;
}

export default createUseStyles({
    root: ({isExtendedBox}: IProps) => {
        const halfTransparentBrightBlue = `${primaryTextColorOne}40`;
        return ({
            width: '100%',
            display: 'flex',
            maxHeight: isExtendedBox ? '700px' : '300px',
            flexDirection: 'column',
            position: 'relative',
            padding: '10px',
            boxSizing: 'border-box',
            backgroundColor: isExtendedBox ? primaryBackgroundColorOne : secondaryBackgroundColorTwo,
            borderRadius: 10,
            border: `1px solid ${halfTransparentBrightBlue}`,
            transition: 'background-color 0.3s ease-in-out, max-height 0.4s ease-in-out'
        })
    },
    arrow: ({isExtendedBox}: IProps) => ({
        height: '25px',
        width: '25px',
        position: 'absolute',
        top: 12,
        left: '10px',
        transform: isExtendedBox ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
            cursor: 'pointer',
            opacity: 0.8
        }
    }),
    openDiv: {
        marginTop:10,
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: 30,
        boxSizing: 'border-box',
        gap: 4,
    },
    title: ({ accessibilityActive }: IProps) => ({
        fontWeight: 600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 24 : 20,
        margin: 0,
        color: primaryTextColorOne,
        width:'80%'
    }),
    subtitle: ({ accessibilityActive }: IProps) => ({
        fontWeight: 600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 22 : 18,
        margin:0,
        color: secondaryTextColorOne
    }),
    paragraph: ({ accessibilityActive }: IProps) => ({
        fontWeight: 300,
        lineHeight: 1.6,
        fontSize: accessibilityActive ? 20 : 16,
        margin:0,
        color: secondaryTextColorOne
    }),
    link:({ accessibilityActive }: IProps)=>({
        display:'flex',
        width:'fit-content',
        fontSize: accessibilityActive ? 20 : 16,
        '&:hover': {
            cursor:'pointer'
        }
    })
});

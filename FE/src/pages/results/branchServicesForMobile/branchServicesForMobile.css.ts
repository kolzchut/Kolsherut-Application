import {createUseStyles} from 'react-jss';
import {
    primaryBackgroundColorOne, primaryBorderColorOne,
    secondaryTextColorOne,
    tertiaryBackgroundColorThree
} from "../../../services/theme.ts";

interface IProps {
    accessibilityActive: boolean;
}

const useStyles = createUseStyles({
    branchServicesPopupDiv: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: primaryBackgroundColorOne,
        color: secondaryTextColorOne,
        boxSizing: 'border-box',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        overflowY: 'auto'
    },
    branchServicesContent: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    featureSection: {
        display: 'flex',
        padding: '10px',
        flexDirection: 'column',
        borderBottom: `1px dotted ${primaryBorderColorOne}`,
        textDecoration: 'none',
        color: secondaryTextColorOne,
        cursor: 'pointer',
    },
    branchTitle: ({accessibilityActive}: IProps) => ({
        fontWeight: '400',
        fontSize: accessibilityActive ? 18 : 14,
        display: '-webkit-box',
        WebkitLineClamp: '2',
        WebkitBoxOrient: 'vertical',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        color: 'inherit'
    }),
    featureLabels: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%'
    },
    branchServiceTopDiv: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        direction: 'rtl',
        padding: '10px',
        boxSizing: 'border-box',
        background: tertiaryBackgroundColorThree,
        alignItems: 'center',
    },
    closeIcon: {
        height: '100%',
        boxSizing: 'border-box',
        paddingLeft: 10,
    },
    strongText: ({accessibilityActive}: IProps) => ({
        fontWeight: 'bold',
        fontSize: accessibilityActive ? 20 : 16,
        alignItems: 'center',
    })
});

export default useStyles;

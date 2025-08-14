import {createUseStyles} from 'react-jss';
import {primaryBackgroundColorOne} from "../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    root: ({accessibilityActive}: IProps) => ({
        position: 'relative',
        height: '100%',
        flex: 4,
        fontSize: accessibilityActive ? 28 : 24,
        maxWidth: 750,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(rgba(0, 80, 255, 0.3), rgba(0, 80, 255, 0.2))',
        direction: 'rtl',
        overflow: 'hidden',
    }),
    backgroundImage: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: -2,
    },
    hamburger:{
      height: '30px'
    },
    aboveDiv: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: '50px',
        gap: '20px',
        padding: '24px',
    },
    kolsherutLogo: {
        height: '90%',
    },
    aboveDivText: ({accessibilityActive}: IProps) => ({
        color: primaryBackgroundColorOne,
        fontSize: accessibilityActive ? 20 : 16,
        lineHeight: 1,
        fontWeight: 400,
        whiteSpace: 'pre-line'
    }),
    bottomDiv: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 78,
        gap: 24,
        padding: '0 24px',
    },
    bottomLogos: {
        height: '30px',
        boxSizing: 'border-box',
    }
});

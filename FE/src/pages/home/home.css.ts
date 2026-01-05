import {createUseStyles} from 'react-jss';

interface IProps {
    isMobile: boolean;
}

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        direction:'rtl',
        width: '100%',
        justifyContent: 'space-between',
        '@media (max-width: 768px)': {
            height:'fit-content',
            flexDirection: 'column',
        }
    },
    main:({isMobile}:IProps)=> ({
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        flex: 6,
        overflowY: isMobile ? 'none' : 'auto',
        scrollbarWidth: 'none',
    })
});

import {createUseStyles} from 'react-jss';

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
        justifyContent: 'space-between',
        '@media (max-width: 768px)': {
            height:'fit-content',
            flexDirection: 'column-reverse',
        }
    },
    main: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        flex: 6,
        overflowY: 'auto',
        scrollbarWidth: 'none',
    }
});

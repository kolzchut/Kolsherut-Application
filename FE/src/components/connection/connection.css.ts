import {createUseStyles} from 'react-jss';
import {brightBlue, gray, white} from "../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: '10px',
        marginTop: '10px',
        marginBottom: '10px',
    },
    aTag: ({ isTel }: { isTel: boolean }) => ({
        display: 'flex',
        alignItems: 'center',
        paddingRight: '10px',
        paddingLeft: '20px',
        flexDirection: 'row',
        justifyContent: 'space-between',
        border: !isTel ? `1px solid ${gray}` : 'none',
        borderRadius: '10px',
        backgroundColor: isTel ? brightBlue : white,
        color: isTel ? white : brightBlue,
        height: '40px',
        flex: 1,
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s, box-shadow 0.2s',

        '&:hover': {
            boxShadow: '0 2px 7px rgba(0, 0, 0, 0.4)',
        },

        '&:focus': {
            outline: '2px solid #007BFF',
            outlineOffset: '2px',
        },
    }),
    aTagImage:{
        height:'70%'
    },
    innerATagText:{
      direction:'ltr',
    },

    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: white,
        border: '1px solid #ccc',
        height: '40px',
        width: '40px',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'background-color 0.2s, box-shadow 0.2s',

        '&:hover': {
            backgroundColor: '#f5f5f5',
            boxShadow: '0 0 5px rgba(0, 0, 0, 0.1)',
        },

        '&:focus': {
            outline: `2px solid ${brightBlue}`,
            outlineOffset: '2px',
        },
    },

})

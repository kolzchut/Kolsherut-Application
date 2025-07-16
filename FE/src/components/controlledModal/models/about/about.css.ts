import {createUseStyles} from 'react-jss';
import {secondaryTextColorTwo, secondaryBackgroundColorOne, primaryBackgroundColorOne} from "../../../../services/theme";

export default createUseStyles({
    root: {
        position: 'relative',
        display: 'flex',
        gap:10,
        flexDirection: 'column',
        heigh: 'fit-content',
        padding: '20px 40px',
        borderRadius: 8,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        direction: 'rtl',
        background: primaryBackgroundColorOne,
    },
    closeIcon: {
        background: "transparent",
        position: "absolute",
        top: 10,
        left: 10,
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 15,
        '&:hover': {
            background: secondaryBackgroundColorOne,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    header:{
      marginBottom: 20
    },
    title:{
      fontSize: '28px',
        fontWeight: 600,
        color:secondaryTextColorTwo
    },
    subtitle:{
      fontSize: '22px',
        fontWeight: 400,
        margin: '10px 0',
        color:secondaryTextColorTwo
    },
    boldStartText:{
        fontWeight: 700,
        fontSize: 18
    },
    inlineParagraph: {
        display:'inline',
        fontSize: 18

    },
    paragraph:{
        display:'inline-block',
        margin:'5px 0',
        alignItems:'center',
        fontSize: 18,
    },
    blackRegularLink:{
        fontWeight: 500,
        color: secondaryTextColorTwo,
    }
});


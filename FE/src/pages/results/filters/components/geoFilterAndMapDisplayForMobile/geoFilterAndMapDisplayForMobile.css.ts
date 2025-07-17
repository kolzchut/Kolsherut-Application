import {createUseStyles} from 'react-jss';
import {
    primaryBackgroundColorOne,
    primaryTextColorTwo, secondaryBackgroundColorOne,
    transparent
} from "../../../../../services/theme";

const genericButton = (conditionToColor: boolean) => ({
    backgroundColor: conditionToColor ? primaryBackgroundColorOne : transparent,
    height: '100%',
    border: 0,
    borderRadius: 20,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background-color 0.4s ease',
})

export default createUseStyles({
    root: {
        background: secondaryBackgroundColorOne,
        height: 50,
        display: 'flex',
        borderRadius: 25,
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '5px 10px',
        margin: '10px 5px',
        boxSizing: 'border-box',
        direction: "rtl",
    },
    nationwideButton: ({isNationwide}: {
        isNationwide: boolean,
        displayResultsMap: boolean,
        isSearchOpen: boolean
    }) => ({
        ...genericButton(isNationwide)
    }),
    mapButton: ({displayResultsMap}: { isNationwide: boolean, displayResultsMap: boolean, isSearchOpen: boolean }) => ({
        ...genericButton(displayResultsMap)
    }),
    searchButton: ({isSearchOpen}: { isNationwide: boolean, displayResultsMap: boolean, isSearchOpen: boolean }) => ({
        ...genericButton(isSearchOpen),
        width: isSearchOpen ? '100%' : 'fit-content',
        gap: 5,
        paddingLeft: '20px'
    }),
    icon: {
        height: '100%'
    },
    textAndMapDiv: {
        display: 'flex',
        fontSize: 16,
        fontWeight: 600,
        color: primaryTextColorTwo,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        justifyContent: 'center'
    },
    count: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1,
        color: primaryTextColorTwo,
        borderRadius: 12,
        background: secondaryBackgroundColorOne,
        padding: '2px 6px',
    },
});

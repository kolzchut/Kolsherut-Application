import {createUseStyles} from 'react-jss';
import {
    primaryBackgroundColorOne,
    primaryTextColorTwo, secondaryBackgroundColorOne,
    transparent
} from "../../../../../services/theme";

interface IProps {
    isNationwide: boolean,
    displayResultsMap: boolean,
    isSearchOpen: boolean,
    accessibilityActive: boolean
}

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
    nationwideButton: ({isNationwide}: IProps) => ({
        ...genericButton(isNationwide)
    }),
    mapButton: ({displayResultsMap}: IProps) => ({
        ...genericButton(displayResultsMap)
    }),
    searchButton: ({isSearchOpen}: IProps) => ({
        ...genericButton(isSearchOpen),
        width: isSearchOpen ? '100%' : 'fit-content',
        gap: 5,
        paddingLeft: '20px'
    }),
    icon: {
        height: '100%'
    },
    textAndMapDiv: ({accessibilityActive}: IProps) => ({
        display: 'flex',
        fontSize: accessibilityActive ? 20 : 16,
        fontWeight: 600,
        color: primaryTextColorTwo,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        justifyContent: 'center'
    }),
    count: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 20 : 16,
        fontWeight: 600,
        lineHeight: 1,
        color: primaryTextColorTwo,
        borderRadius: 12,
        background: secondaryBackgroundColorOne,
        padding: '2px 6px',
    }),
});

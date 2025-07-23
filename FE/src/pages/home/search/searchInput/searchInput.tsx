import lightIconSearch from "../../../../assets/icon-search-blue-1.svg";
import {ChangeEvent, useEffect, useRef, useState} from "react";
import AutocompleteType from "../../../../types/autocompleteType";
import sendMessage from "../../../../services/sendMessage/sendMessage";
import useStyles from "./searchInput.css";
import closeIcon from "../../../../assets/icon-close-blue-3.svg";
import SearchOption from "./searchOption/searchOption";
import {searchInputFocusEvent} from "../../../../services/gtag/homepageEvents.ts";
import {useDebounce} from "../../../../hooks/useDebounce.ts";
import useOnClickedOutside from "../../../../hooks/useOnClickedOutside.ts";

const inputDescription = "Search for services, organizations, branches, and more"

const SearchInput = () => {

    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
    const {ref} = useOnClickedOutside(() => setOptionalSearchValues([]));

    useEffect(() => {
        const handleFocus = () => {
            setIsSearchInputFocused(true);
            searchInputFocusEvent();
        }
        const handleBlur = () => setIsSearchInputFocused(false);

        const inputElement = searchInputRef.current;
        if (inputElement) {
            inputElement.addEventListener("focus", handleFocus);
            inputElement.addEventListener("blur", handleBlur);
        }

        return () => {
            if (inputElement) {
                inputElement.removeEventListener("focus", handleFocus);
                inputElement.removeEventListener("blur", handleBlur);
            }
        };
    }, [searchInputRef]);
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const moveUp = isSearchInputFocused || searchTerm !== '' || optionalSearchValues.length > 0;
    const classes = useStyles({moveUp});
    const debouncedGetAutoComplete = useDebounce(async (value) => {
        if (value === '') return setOptionalSearchValues([]);
        const requestURL = window.config.routes.autocomplete.replace('%%search%%', value);
        const response = await sendMessage({method: 'get', requestURL});
        setOptionalSearchValues(response.data);
    }, 1000);
    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>) => {
        const value: string = v.target.value;
        setSearchTerm(value);
        debouncedGetAutoComplete(value);
    };
    const onClose = () => {
        setSearchTerm("");
        setOptionalSearchValues([]);
    }
    return <div className={classes.root} >
        <div className={classes.mainTextDiv}>
            <span className={classes.mainText}>{window.strings.home.mainTextPartOne}
                <span
                    className={`${classes.mainText} ${classes.mainTextBold}`}>{window.strings.home.mainTextMiddleBold}</span>
                {window.strings.home.mainTextPartTwo}</span>
        </div>
        <div className={classes.searchContainer} ref={ref}>
            <img className={classes.searchButton} alt={"חיפוש"} src={lightIconSearch}/>
            <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={inputChangeEvent}
                className={classes.searchInput}
                placeholder={window.strings.search.label}
                aria-label={inputDescription}
            />
            {searchTerm &&
                <button className={classes.closeIconButton} onClick={onClose}>
                    <img className={classes.closeIconImg} src={closeIcon} alt={"close list"}/>
                </button>}
            <div className={classes.optionalSearchValuesWrapper}>
                {optionalSearchValues.map((value: AutocompleteType, index: number) => (
                    <SearchOption value={value} onCloseSearchOptions={onClose} key={index}/>
                ))}
            </div>
        </div>
    </div>
}
export default SearchInput;

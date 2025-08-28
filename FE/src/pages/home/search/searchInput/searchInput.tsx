import lightIconSearch from "../../../../assets/icon-search-blue-1.svg";
import {ChangeEvent, KeyboardEvent, useEffect, useRef, useState} from "react";
import AutocompleteType, {IStructureAutocomplete} from "../../../../types/autocompleteType";
import sendMessage from "../../../../services/sendMessage/sendMessage";
import useStyles from "./searchInput.css";
import closeIcon from "../../../../assets/icon-close-blue-3.svg";
import SearchOption from "./searchOption/searchOption";
import homepageAnalytics from "../../../../services/gtag/homepageEvents";
import {useDebounce} from "../../../../hooks/useDebounce";
import useOnClickedOutside from "../../../../hooks/useOnClickedOutside";
import {settingToResults} from "../../../../store/shared/sharedSlice";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";

const inputDescription = "Search for services, organizations, branches, and more"
const emptyAutocomplete: AutocompleteType = {structured: [], unstructured: []};

const SearchInput = () => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
    const {ref} = useOnClickedOutside(() => setOptionalSearchValues(emptyAutocomplete));

    useEffect(() => {
        const handleFocus = () => {
            setIsSearchInputFocused(true);
            homepageAnalytics.searchInputFocusEvent();
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
    const [optionalSearchValues, setOptionalSearchValues] = useState<AutocompleteType>(emptyAutocomplete);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const theme = useTheme<IDynamicThemeApp>();

    const moveUp = isSearchInputFocused || searchTerm !== '' || optionalSearchValues.structured.length > 0 || optionalSearchValues.unstructured.length > 0;
    const classes = useStyles({moveUp, accessibilityActive: theme.accessibilityActive});
    const debouncedGetAutoComplete = useDebounce(async (value) => {
        if (value === '') return setOptionalSearchValues(emptyAutocomplete);
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
        setOptionalSearchValues(emptyAutocomplete);
    }
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            settingToResults({value: {query: searchTerm}, removeOldFilters: true});
            onClose()
        }
    };

    return <div className={classes.root}>
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
                onKeyDown={handleKeyDown}
                className={classes.searchInput}
                placeholder={window.strings.search.label}
                aria-label={inputDescription}
            />
            {searchTerm &&
                <button className={classes.closeIconButton} onClick={onClose}>
                    <img className={classes.closeIconImg} src={closeIcon} alt={"close list"}/>
                </button>}
            {(optionalSearchValues.structured.length > 0 || optionalSearchValues.unstructured.length> 0) && <div className={classes.optionalSearchValuesWrapper}>
                {optionalSearchValues.structured.length > 0 &&
                    optionalSearchValues.structured.map((value: IStructureAutocomplete, index: number) => (
                        <SearchOption value={value} isStructured={true} key={index} onCloseSearchOptions={onClose}/>
                    ))}
                    {optionalSearchValues.unstructured.map((value, index) => (
                        <SearchOption value={value} isStructured={false} key={index} onCloseSearchOptions={onClose}/>
                    ))}
            </div>}
        </div>
    </div>
}
export default SearchInput;

import lightIconSearch from "../../../../assets/icon-search-blue-1.svg";
import {KeyboardEvent, useEffect, useRef, useState} from "react";
import AutocompleteType, {IStructureAutocomplete} from "../../../../types/autocompleteType";
import useStyles from "./searchInput.css";
import closeIcon from "../../../../assets/icon-close-blue-3.svg";
import SearchOption from "./searchOption/searchOption";
import homepageAnalytics from "../../../../services/gtag/homepageEvents";
import useOnClickedOutside from "../../../../hooks/useOnClickedOutside";
import {useTheme} from "react-jss";
import IDynamicThemeApp from "../../../../types/dynamicThemeApp.ts";
import useSearchAutocomplete from "../../../../hooks/useSearchAutocomplete";
import DefaultSearchOptions from "../../../../components/defaultSearchOptions/defaultSearchOptions.tsx";
import executeSearch from "../../../../services/executeSearch.ts";

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

    const { inputChangeEvent } = useSearchAutocomplete({ setSearchTerm, setOptionalSearchValues });

    const onClose = () => {
        setSearchTerm("");
        setOptionalSearchValues(emptyAutocomplete);
    }
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const defaultValue = {query: searchTerm};
            const optionalStructuredValue = optionalSearchValues.structured.find(v => v.query === searchTerm || v.label === searchTerm);
            const optionalUnstructuredValue = optionalSearchValues.unstructured.find(v => v.query === searchTerm|| v.label === searchTerm);
            const value = optionalStructuredValue || optionalUnstructuredValue || defaultValue;
            executeSearch({value, isStructured: !!(optionalStructuredValue), onClose})
        }
    };
    const hasResults = (optionalSearchValues.structured.length > 0 || optionalSearchValues.unstructured.length > 0);
    const showAutocompleteResults = hasResults;
    const showAutocompleteDefaults = (!hasResults && isSearchInputFocused)

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
                autoComplete="off"
                name={"search service"}
            />
            {searchTerm &&
                <button className={classes.closeIconButton} onClick={onClose}>
                    <img className={classes.closeIconImg} src={closeIcon} alt={"close list"}/>
                </button>}
            {showAutocompleteResults && <div className={classes.optionalSearchValuesWrapper}>
                {optionalSearchValues.structured.length > 0 &&
                    optionalSearchValues.structured.map((value: IStructureAutocomplete, index: number) => (
                        <SearchOption value={value} isStructured={true} key={index} onCloseSearchOptions={onClose}/>
                    ))}
                    {optionalSearchValues.unstructured.map((value, index) => (
                        <SearchOption value={value} isStructured={false} key={index} onCloseSearchOptions={onClose}/>
                    ))}
            </div>}
            {showAutocompleteDefaults && <div className={classes.optionalSearchValuesWrapper}>
               <DefaultSearchOptions onCloseSearchOptions={onClose}/>
            </div>}
        </div>
    </div>
}
export default SearchInput;

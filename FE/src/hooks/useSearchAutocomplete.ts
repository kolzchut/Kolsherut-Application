import {ChangeEvent} from "react";
import {useDebounce} from "./useDebounce";
import AutocompleteType from "../types/autocompleteType";
import sendMessage from "../services/sendMessage/sendMessage";
import buildAutocompleteRequestURL from "../services/searchUtilities/buildAutocompleteRequestURL";

interface Params {
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setOptionalSearchValues: React.Dispatch<React.SetStateAction<AutocompleteType>>;
    debounceMs?: number;
}

const emptyAutocomplete: AutocompleteType = {structured: [], unstructured: []};

const useSearchAutocomplete = ({setSearchTerm, setOptionalSearchValues, debounceMs = 500}: Params) => {
    const debouncedGetAutoComplete = useDebounce(async (value: unknown) => {
        const searchTerm = String(value ?? '').trim();
        if (searchTerm === '') return setOptionalSearchValues(emptyAutocomplete);
        const requestURL = buildAutocompleteRequestURL(searchTerm);
        const response = await sendMessage({method: 'get', requestURL});
        setOptionalSearchValues(response?.success && response.data ? response.data : emptyAutocomplete);
    }, debounceMs);

    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>) => {
        const value: string = v.target.value;
        setSearchTerm(value);
        debouncedGetAutoComplete(value);
    };

    return {debouncedGetAutoComplete, inputChangeEvent};
}

export default useSearchAutocomplete;

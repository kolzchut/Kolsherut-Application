import {ChangeEvent} from "react";
import {useDebounce} from "./useDebounce";
import AutocompleteType from "../types/autocompleteType";
import sendMessage from "../services/sendMessage/sendMessage";

interface Params {
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setOptionalSearchValues: React.Dispatch<React.SetStateAction<AutocompleteType>>;
    debounceMs?: number;
}

const emptyAutocomplete: AutocompleteType = {structured: [], unstructured: []};

const useSearchAutocomplete = ({setSearchTerm, setOptionalSearchValues, debounceMs = 500}: Params) => {
    const debouncedGetAutoComplete = useDebounce(async (value: unknown) => {
        if (value === '') return setOptionalSearchValues(emptyAutocomplete);
        const requestURL = window.config.routes.autocomplete.replace('%%search%%', value);
        const response = await sendMessage({method: 'get', requestURL});
        setOptionalSearchValues(response.data);
    }, debounceMs);

    const inputChangeEvent = (v: ChangeEvent<HTMLInputElement>) => {
        const value: string = v.target.value;
        setSearchTerm(value);
        debouncedGetAutoComplete(value);
    };

    return {debouncedGetAutoComplete, inputChangeEvent};
}

export default useSearchAutocomplete;


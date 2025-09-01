import {useEffect, useState, useMemo} from "react";
import axios from "axios";
import logger from "../../services/logger/logger.ts";
import SearchOption from "../../pages/home/search/searchInput/searchOption/searchOption.tsx";
import {IStructureAutocomplete} from "../../types/autocompleteType.ts";

interface IPreset {
    cityName?: string,
    label?: string,
    labelHighlighted?: string,
    query: string,
    responseId?: string,
    situationId?: string,
    by?: string,
    bounds?: [number, number, number, number]
}

const buildSearchOptionFromPreset = (preset: IPreset) => {
    return {
        bounds: preset.bounds,
        query: preset.query,
        label: preset.label,
        situationId: preset.situationId,
        responseId: preset.responseId,
        cityName: preset.cityName,
        by: preset.by,
        labelHighlighted: preset.labelHighlighted,
    } as IStructureAutocomplete;
}


const DefaultSearchOptions = ({onCloseSearchOptions}: { onCloseSearchOptions: () => void }) => {
    const [presets, setPresets] = useState<IPreset[]>([]);

    useEffect(() => {
        const getPresets = async () => {
            try {
                const response = await axios.get(`/configs/presets.json?cacheBuster=${Date.now()}`);
                setPresets(response.data);
            } catch (error) {
                logger.error({message: "Error fetching optional presets:", payload: error});
            }
        };
        getPresets();
    }, []);

    const items = useMemo(() => presets.map((preset: IPreset) => {
        const value = buildSearchOptionFromPreset(preset);
        const isStructured = !!(preset.responseId || preset.situationId || preset.cityName || preset.bounds || preset.by);
        const key = `${preset.query}`;
        return (
            <SearchOption
                key={key}
                value={value}
                onCloseSearchOptions={onCloseSearchOptions}
                isStructured={isStructured}
            />
        );
    }), [presets, onCloseSearchOptions]);

    return <>{items}</>;
}
export default DefaultSearchOptions;

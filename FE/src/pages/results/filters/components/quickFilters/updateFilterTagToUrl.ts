import logger from "../../../../../services/logger/logger";

interface IAddFilterTagToUrl {
    url: string;
    value: string;
    isResponse: boolean;
    isFilterActive: boolean;
}

const getSegmentKey = (isResponse: boolean): string => {
    return isResponse ? 'rf' : 'sf';
};

const normalizeValue = (val: string): string => {
    try {
        return decodeURIComponent(val);
    } catch (error) {
        return val;
    }
};

const extractUrlSegment = (decodedUrl: string, key: string) => {
    const segmentIdentifier = `/${key}/`;
    const splitIndex = decodedUrl.indexOf(segmentIdentifier);

    if (splitIndex === -1) {
        return {
            prefix: decodedUrl,
            existingValues: [],
            suffix: '',
            found: false
        };
    }

    const prefix = decodedUrl.substring(0, splitIndex + segmentIdentifier.length);
    const rest = decodedUrl.substring(splitIndex + segmentIdentifier.length);
    const nextSlashIndex = rest.indexOf('/');

    let valueStr = '';
    let suffix = '';

    if (nextSlashIndex !== -1) {
        valueStr = rest.substring(0, nextSlashIndex);
        suffix = rest.substring(nextSlashIndex);
    } else {
        valueStr = rest;
    }

    let existingValues: string[] = [];
    try {
        const trimmed = valueStr.trim();
        if (trimmed.startsWith('[')) {
            existingValues = JSON.parse(trimmed);
        } else if (trimmed.length > 0) {
            existingValues = [trimmed];
        }
    } catch (e) {
        logger.error({ message: `Error parsing ${key}`, payload: e });
        existingValues = [];
    }

    const cleanValues = existingValues.map(normalizeValue);

    return { prefix, existingValues: cleanValues, suffix, found: true };
};

const updateValueList = (currentList: string[], value: string, shouldRemove: boolean): string[] => {
    const targetValue = normalizeValue(value);
    const uniqueSet = new Set(currentList);

    if (shouldRemove)
        uniqueSet.delete(targetValue);
    else
        uniqueSet.add(targetValue);

    return Array.from(uniqueSet);
};

const serializeAndEncode = (list: string[]): string => {
    const jsonString = JSON.stringify(list);

    return encodeURIComponent(jsonString)
        .replace(/%3A/g, ':')
        .replace(/%2C/g, ',')
        .replace(/%5B/g, '[')
        .replace(/%5D/g, ']');
};

const updateFilterTagToUrl = ({ url, value, isResponse, isFilterActive }: IAddFilterTagToUrl): string => {
    const key = getSegmentKey(isResponse);
    const decodedUrl = decodeURIComponent(url);

    const { prefix, existingValues, suffix, found } = extractUrlSegment(decodedUrl, key);
    const updatedList = updateValueList(existingValues, value, isFilterActive);

    if (updatedList.length === 0) {
        if (!found) return url;
        const cleanPrefix = prefix.substring(0, prefix.lastIndexOf(`/${key}/`));
        return cleanPrefix + suffix;
    }

    const encodedValue = serializeAndEncode(updatedList);
    if (!found) return `${url}/${key}/${encodedValue}`;
    return `${prefix}${encodedValue}${suffix}`;
};

export default updateFilterTagToUrl;

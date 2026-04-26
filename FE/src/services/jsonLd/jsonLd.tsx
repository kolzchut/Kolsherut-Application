import {replaceMacros} from "../str";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface IProps {
    templates: JsonValue[];
    macrosAndReplacements: Record<string, string>;
    objectReplacements?: Record<string, JsonValue>;
}

const JsonLd = ({templates, macrosAndReplacements, objectReplacements = {}}: IProps) => {
    // Escape replacement values so control characters (newlines, tabs, etc.)
    // don't break the JSON string after macro substitution.
    const safeMacros: Record<string, string> = {};
    for (const [key, value] of Object.entries(macrosAndReplacements)) {
        // JSON.stringify escapes special chars and wraps in quotes — strip the quotes
        safeMacros[key] = JSON.stringify(value).slice(1, -1);
    }

    const processedSchemas = templates.map((template) => {
        let jsonString = JSON.stringify(template);

        jsonString = replaceMacros({
            stringWithMacros: jsonString,
            macrosAndReplacements: safeMacros
        });

        let schema: JsonValue = JSON.parse(jsonString);

        schema = replaceObjectMacros(schema, objectReplacements);

        return schema;
    });

    return (
        <>
            {processedSchemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
                />
            ))}
        </>
    );
};

const replaceObjectMacros = (obj: JsonValue, objectReplacements: Record<string, JsonValue>): JsonValue => {
    if (typeof obj === "string") {
        return objectReplacements[obj] !== undefined ? objectReplacements[obj] : obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => replaceObjectMacros(item, objectReplacements));
    }
    if (obj && typeof obj === "object") {
        const result: Record<string, JsonValue> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = replaceObjectMacros(value, objectReplacements);
        }
        return result;
    }
    return obj;
}

export default JsonLd;

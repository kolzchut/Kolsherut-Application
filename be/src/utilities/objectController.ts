export const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export const setNestedValue = (obj: any, path: string, value: any) => {
    const parts = path.split('.');
    const last = parts.pop();
    if (!last) return;
    const target = parts.reduce((acc, part) => acc && acc[part], obj);
    if (target) {
        target[last] = value;
    }
}

export const replaceNestedValue = (obj: any, path: string, valuesToReplace: any[], replacementValue: any) => {
    const parts = path.split('.');

    const traverse = (current: any, depth: number) => {
        if (!current) return;

        // Handle Array in path (transparent traversal for intermediate arrays)
        if (Array.isArray(current)) {
            current.forEach(item => traverse(item, depth));
            return;
        }

        const key = parts[depth];

        // If this is the property we are looking for (leaf property)
        if (depth === parts.length - 1) {
            const val = current[key];
            if (val === undefined) return;

            // If the leaf value itself is an array, check its elements
            if (Array.isArray(val)) {
                val.forEach((item, idx) => {
                    if (valuesToReplace.includes(item)) {
                        val[idx] = replacementValue;
                    }
                });
            } else {
                // Primitive value
                if (valuesToReplace.includes(val)) {
                    current[key] = replacementValue;
                }
            }
            return;
        }

        // Continue traversal
        traverse(current[key], depth + 1);
    };

    traverse(obj, 0);
};

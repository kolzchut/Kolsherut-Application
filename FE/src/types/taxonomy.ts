export interface Translation {
    he?: string;
    [lang: string]: string | undefined;
}

export interface NodeName {
    source?: string;
    tx?: Translation;
}

export interface InputNode {
    name?: NodeName;
    slug: string;
    pk?: string;
    items?: InputNode[];
}

export interface FlatNode {
    slug: string;
    subSlug: string;
    en?: string;
    he?: string;
}

export interface GtagItem {
    item_name: string | undefined;
    item_brand: string;
    item_variant: string;
    index?: number;
    item_list_name: string | null;
    [key: `item_category${number}`]: string | undefined;
}

export interface LogEventArgs {
    event: string;
    params: Record<string, unknown>;
}

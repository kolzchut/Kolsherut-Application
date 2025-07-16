export interface ILabel {
    situation_id?: string,
    response_id?: string,
    title?: string,
    query?: string
}

export interface IGroup {
    group: string
    showBorder?: boolean,
    situation_id: string,
    response_id: string,
    group_link: string,
    labels: Array<ILabel>
}

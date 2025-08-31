export interface ILabel {
    situation_id?: string,
    response_id?: string,
    by?: string,
    title?: string,
    query?: string
    cityName?:string,
    bounds?: [number, number, number, number]

}

export interface IGroup {
    group: string
    icon?: string,
    showBorder?: boolean,
    situation_id: string,
    response_id: string,
    group_link: string,
    labels: Array<ILabel>
}

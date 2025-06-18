export default interface IWayPoint {
    description?: string
    featureType?: string
    id?:number
    local_coordinates?: [number, number];
    name?: string
    wp_id: number
    route_id: number
}

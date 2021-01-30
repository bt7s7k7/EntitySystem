export interface SaveData {
    entities: SaveData.Entity[]
}

export namespace SaveData {
    export interface Entity {
        id: string
        parent: string | null
        components: Component[]
    }

    export interface Component {
        name: string
        data: Record<string, any>
    }
}
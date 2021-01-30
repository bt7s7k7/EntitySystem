import { Entity } from "../Entity";
import { SaveData } from "./SaveData";
import { SavingIndex } from "./SavingIndex";

export interface SavePayload {
    target: SaveData.Component["data"],
    entity: Entity,
    component: any,
    index: SavingIndex,
    name: string,
    field: string
}
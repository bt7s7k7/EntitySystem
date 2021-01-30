import { Entity } from "../../entitySystem/Entity";

/** Stores and marks all entities with an id during saving and loading */
export class SavingIndex {

    public register(entity: Entity, id = (this.idCounter++).toString()) {
        if (this.entityIDs.has(entity)) return
        this.entities[id] = entity
        this.entityIDs.set(entity, id.toString())
    }

    public getID(entity: Entity) {
        const ret = this.entityIDs.get(entity)
        if (ret) {
            return ret
        } else throw new RangeError(`Tried to get id of not registered entity`)
    }

    public getEntity(id: string) {
        const ret = this.entities[id]
        if (ret) {
            return ret
        } else throw new RangeError(`No entity with id "${id}" found`)
    }

    public hasID(entity: Entity) {
        return this.entityIDs.has(entity)
    }

    protected idCounter = 0
    protected entities: Record<string, Entity> = {}
    protected entityIDs = new Map<Entity, string>()
}
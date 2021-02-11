import { Entity } from "../../entitySystem/Entity"

export class EntityNotIndexedError extends Error { }

/** Stores and marks all entities with an id during saving and loading */
export class SavingIndex {

    public register(entity: Entity, id: string | null = null) {
        if (this.entityIDs.has(entity)) return
        if (id == null) {
            id = this.nextID()
        } else {
            if (id in this.entities) throw new Error(`Duplicate ID for registered entity "${id}"`)
        }
        this.entities[id] = entity
        this.entityIDs.set(entity, id.toString())
    }

    public unregister(entity: Entity) {
        const id = this.entityIDs.get(entity)
        if (!id) throw new EntityNotIndexedError("Tried to unregister not registered entity")

        this.entityIDs.delete(entity)
        delete this.entities[id]
    }

    public getID(entity: Entity) {
        const ret = this.entityIDs.get(entity)
        if (ret) {
            return ret
        } else throw new EntityNotIndexedError(`Tried to get id of not registered entity`)
    }

    public getEntity(id: string) {
        const ret = this.entities[id]
        if (ret) {
            return ret
        } else throw new EntityNotIndexedError(`No entity with id "${id}" found`)
    }

    public tryGetEntity(id: string): Entity | null {
        return this.entities[id] ?? null
    }

    public hasID(entity: Entity) {
        return this.entityIDs.has(entity)
    }

    public nextID() {
        let ret = "0"
        while (ret in this.entities) {
            ret = (this.idCounter++).toString()
        }
        return ret
    }

    protected idCounter = 0
    protected entities: Record<string, Entity> = {}
    protected entityIDs = new Map<Entity, string>()
}
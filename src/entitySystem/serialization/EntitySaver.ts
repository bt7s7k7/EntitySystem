import { Component } from "../Component";
import { Entity } from "../Entity";
import { EntitySystem } from "../EntitySystem";
import { ComponentConstructor } from "../util";
import { ComponentManifest, ManifestedComponent } from "./ComponentManifest";
import { ComponentRegistry } from "./ComponentRegistry";
import { SaveData } from "./SaveData";
import { SavingIndex } from "./SavingIndex";

export class SerializableComponentNotRegisteredError extends Error { }
export class NonSerializableParentError extends Error { }

export class EntitySaver {

    public save(system: EntitySystem): SaveData {
        const entities = new Map<Entity, { component: Component, manifest: ComponentManifest }[]>()
        const index = new SavingIndex()

        for (const component of system.getAllComponents()) {
            if (ComponentManifest.MANIFEST in component.constructor) {
                if (!this.componentRegistry.hasComponent(component)) throw new SerializableComponentNotRegisteredError(`Found serializable component "${component.constructor.name}", but it's not registered in the registry`)
                const manifest = (component.constructor as ManifestedComponent)[ComponentManifest.MANIFEST]

                const entity = component.entity;
                if (!entities.has(entity)) {
                    entities.set(entity, [])
                    index.register(entity)
                }
                entities.get(entity)!.push({
                    component,
                    manifest
                })
            }
        }

        const saveData: SaveData = { entities: [] }

        for (const [entity, components] of entities) {
            const parent = entity.getParent()
            if (parent && !index.hasID(parent)) throw new NonSerializableParentError(`Serialized entity has a parent that is not serialized`)

            const entitySaveData: SaveData.Entity = {
                id: index.getID(entity),
                components: [],
                parent: parent ? index.getID(parent!) : null
            }

            saveData.entities.push(entitySaveData)

            for (const { component, manifest } of components) {
                const componentSaveData: SaveData.Component = {
                    data: {},
                    name: manifest.name
                }

                entitySaveData.components.push(componentSaveData)

                for (const field of manifest.fields) {
                    field.type.save({
                        component, entity, index,
                        name: field.name,
                        target: componentSaveData.data,
                        field: field.name
                    })
                }
            }
        }

        return saveData
    }

    public load(system: EntitySystem, saveData: SaveData) {
        const index = new SavingIndex()
        const deferredParentAssignment: Record<string, Entity[]> = {}
        const deferredFieldRuns: (() => void)[] = []
        const loadedComponents = new Map<ComponentConstructor, Component[]>()

        for (const entityData of saveData.entities) {
            const builder = Entity.make().setSystem(system)
            const createdComponents: { data: SaveData.Component["data"], component: Component, manifest: ComponentManifest }[] = []

            for (const { data, name } of entityData.components) {
                const type = this.componentRegistry.getComponent(name)
                const manifest = type[ComponentManifest.MANIFEST]

                builder.addComponent(type, make => {
                    const component = make()

                    createdComponents.push({ component, data, manifest })

                    if (!loadedComponents.has(type)) loadedComponents.set(type, [])
                    loadedComponents.get(type)!.push(component)

                    return make()
                })
            }

            const entity = builder.build()
            index.register(entity, entityData.id)

            for (const { component, data, manifest } of createdComponents) {
                for (const field of manifest.fields) {
                    const run = () => {
                        field.type.load({
                            component, entity, index,
                            name: field.name,
                            field: field.name,
                            target: data,
                        })
                    }
                    if (field.type.defer) {
                        deferredFieldRuns.push(run)
                    } else run()
                }
            }

            if (entityData.parent) {
                const assignment = deferredParentAssignment[entityData.parent] = (deferredParentAssignment[entityData.parent] ?? [])
                assignment.push(entity)
            }
        }

        for (const [parentId, children] of Object.entries(deferredParentAssignment)) {
            const parent = index.getEntity(parentId)

            for (const child of children) {
                parent.addChild(child)
            }
        }

        for (const run of deferredFieldRuns) {
            run()
        }

        return loadedComponents
    }

    constructor(
        protected readonly componentRegistry: ComponentRegistry
    ) { }
}
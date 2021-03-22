import { Component } from "../../entitySystem/Component"
import { ComponentConstructor } from "../../entitySystem/util"
import { SaveData } from "./SaveData"
import { SaveType } from "./SaveType"
import { SavingIndex } from "./SavingIndex"

/** Stores all properties to be saved and loaded */
export class ComponentManifest<T extends Component = Component> {
    public saveComponent(component: T, index: SavingIndex): SaveData.Component {
        const componentSaveData: SaveData.Component = {
            data: {},
            name: this.name
        }

        const entity = component.entity
        if (!entity) throw new Error("No entity in component")

        for (const field of this.fields) {
            field.type.save({
                component, entity, index,
                name: field.name,
                target: componentSaveData.data,
                field: field.name
            })
        }

        return componentSaveData
    }

    public loadComponent(component: T, saveData: SaveData.Component, index: SavingIndex, deferredFieldRuns: (() => void)[]) {
        const entity = component.entity
        for (const field of this.fields) {
            const run = () => {
                field.type.load({
                    component, entity, index,
                    name: field.name,
                    field: field.name,
                    target: saveData.data,
                })
            }
            if (field.type.defer) {
                deferredFieldRuns.push(run)
            } else run()
        }
    }

    constructor(
        public readonly name: string,
        public readonly component: new (...args: any) => T,
        public readonly fields: ComponentManifest.Field<T>[]
    ) { }
}

export namespace ComponentManifest {
    export interface Field<T = Component> {
        name: { [P in keyof T]: P extends string ? P : never }[keyof T],
        type: SaveType
    }

    export const MANIFEST = Symbol("manifest")
}

export interface ManifestedComponent extends ComponentConstructor {
    [ComponentManifest.MANIFEST]: ComponentManifest<any>
}
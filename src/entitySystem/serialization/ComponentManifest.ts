import { Component } from "../../entitySystem/Component";
import { ComponentConstructor } from "../../entitySystem/util";
import { SaveType } from "./SaveType";

/** Stores all properties to be saved and loaded */
export class ComponentManifest<T extends Component = Component> {
    public readonly name = this.component.name

    constructor(
        public readonly component: new (...args: any) => T,
        public readonly fields: ComponentManifest.Field<T>[]
    ) { }
}

export namespace ComponentManifest {
    export interface Field<T> {
        name: { [P in keyof T]: P extends string ? P : never }[keyof T],
        type: SaveType
    }

    export const MANIFEST = Symbol("manifest")
}

export interface ManifestedComponent extends ComponentConstructor {
    [ComponentManifest.MANIFEST]: ComponentManifest<any>
}
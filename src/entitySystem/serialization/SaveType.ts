import { Component } from "../Component"
import { ComponentManifest, ManifestedComponent } from "./ComponentManifest"
import { SavePayload } from "./SavePayload"

export interface SaveType {
    name: string,
    defer: boolean,
    save(payload: SavePayload): void
    load(payload: SavePayload): void
}

export namespace SaveType {
    export const string: SaveType = ({
        name: "string",
        defer: false,
        load(payload) {
            let source = payload.target[payload.name]
            if (typeof source == "string") {
                payload.component[payload.field] = source
            }
        },
        save(payload) {
            payload.target[payload.name] = payload.component[payload.field]
        }
    })

    export const number: SaveType = ({
        name: "number",
        defer: false,
        load(payload) {
            let source = payload.target[payload.name]
            if (typeof source == "number") {
                payload.component[payload.field] = source
            }
        },
        save(payload) {
            payload.target[payload.name] = payload.component[payload.field]
        }
    })

    export const boolean: SaveType = ({
        name: "boolean",
        defer: false,
        load(payload) {
            let source = payload.target[payload.name]
            if (typeof source == "boolean") {
                payload.component[payload.field] = source
            }
        },
        save(payload) {
            payload.target[payload.name] = payload.component[payload.field]
        }
    })

    export const component = (component: ManifestedComponent): SaveType => {
        const manifest = component[ComponentManifest.MANIFEST]

        return {
            name: `component<${component.name}>`,
            defer: true,
            load(payload) {
                const id = payload.target[payload.name]

                const entity = payload.index.getEntity(id)

                const targetComponent = entity.getComponent(component)

                payload.component[payload.field] = targetComponent
            },

            save(payload) {
                const targetComponent = payload.component[payload.field] as Component | null
                if (targetComponent == null) return
                const entity = targetComponent.entity

                const id = payload.index.getID(entity)

                payload.target[payload.name] = id
            }
        }
    }
}
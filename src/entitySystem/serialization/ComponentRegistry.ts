import { Component } from "../Component";
import { ManifestedComponent } from "./ComponentManifest";

export class ComponentRegistry {
    public getComponent(name: string) {
        const ret = this.components[name]
        if (ret) return ret
        else throw new Error(`No registered component with name "${name}"`)
    }

    public hasComponent(component: Component) {
        const name = component.constructor.name
        return name in this.components
    }

    public register<T extends ManifestedComponent>(component: T) {
        this.components[component.name] = component
    }

    protected readonly components: Record<string, ManifestedComponent> = {}
}
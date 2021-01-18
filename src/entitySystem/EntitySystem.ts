import { Disposable, DISPOSE } from "../eventLib/Disposable";
import { EventEmitter } from "../eventLib/EventEmitter";
import { Component } from "./Component";
import { ComponentConstructor, ConstructorReturnValue } from "./util";

/** 
 * Handles dispatching events on all components
 */
export class EntitySystem extends Disposable {
    /** Get the EventEmitter for this event */
    public on<T>(event: EntitySystem.EventDefinition<T>): EventEmitter<T> {
        if (!this.events.has(event)) {
            this.events.set(event, new EventEmitter())
        }

        return this.events.get(event)!
    }

    public findComponents<T extends ComponentConstructor>(type: T): ConstructorReturnValue<T>[] {
        const set = this.components.get(type)
        if (set) {
            return [...set.values()] as ConstructorReturnValue<T>[]
        } else {
            return []
        }
    }

    public findComponent<T extends ComponentConstructor>(type: T): ConstructorReturnValue<T> {
        const ret = this.findComponents(type)
        if (ret.length > 0) return ret[0]
        else throw new Error(`Failed to find a component of type "${type.name}"`)
    }

    /** Internal method to register a component into a component index */
    public registerComponent(component: Component) {
        const ctor = component.constructor as ComponentConstructor
        if (!this.components.has(ctor)) this.components.set(ctor, new Set())

        this.components.get(ctor)!.add(component)
    }

    /** Internal method to unregister a component from a component index */
    public unregisterComponent(component: Component) {
        const ctor = component.constructor as ComponentConstructor
        if (!this.components.get(ctor)!.delete(component)) throw new Error("Tried to unregister a component that was newer registered")
    }

    public [DISPOSE] = () => {
        super[DISPOSE]()

        for (const [, eventEmitter] of this.events) { // Dispose all the EventEmitters
            eventEmitter.dispose()
        }

        this.events.clear()
    }

    /** All EventEmitters, indexed by their event definition*/
    protected events = new Map<EntitySystem.EventDefinition<any>, EventEmitter<any>>()
    protected components = new Map<ComponentConstructor, Set<Component>>()
}

export namespace EntitySystem {
    /** Defines an event type to be used with an EntitySystem */
    export class EventDefinition<T> {
        constructor(
            public name: string
        ) { }
    }
}
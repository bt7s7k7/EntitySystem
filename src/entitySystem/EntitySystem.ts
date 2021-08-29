import { Disposable, DISPOSE } from "../eventLib/Disposable"
import { EventEmitter } from "../eventLib/EventEmitter"
import { Component } from "./Component"
import { Entity, Prefab } from "./Entity"
import { ComponentConstructor } from "./util"

const emptyIterator: IterableIterator<never> = {
    [Symbol.iterator]() {
        return this
    },
    next() {
        return { done: true, value: null }
    }
}

function getConstructorChain(component: Component) {
    let target = component.constructor as ComponentConstructor
    const chain: ComponentConstructor[] = []
    do {
        if (target == Component as any) break
        chain.push(target)
    } while ((target = Object.getPrototypeOf(target)))

    return chain
}

type ComponentType<T extends Component> = new (...args: any[]) => T

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

    public findComponents<T extends Component>(type: ComponentType<T>): T[] {
        const set = this.components.get(type)
        if (set) {
            return [...set.values()] as T[]
        } else {
            return []
        }
    }

    public iterateComponents<T extends Component>(type: ComponentType<T>): IterableIterator<T> {
        const set = this.components.get(type)
        if (set) {
            return set.values() as IterableIterator<T>
        } else {
            return emptyIterator
        }
    }

    public countComponents(type: ComponentConstructor) {
        return this.components.get(type)?.size ?? 0
    }

    public findComponent<T extends Component>(type: ComponentType<T>): T {
        const ret = this.findComponents(type)
        if (ret.length > 0) return ret[0]
        else throw new Error(`Failed to find a component of type "${type.name}"`)
    }

    /** Internal method to register a component into a component index */
    public registerComponent(component: Component) {
        for (const ctor of getConstructorChain(component)) {
            if (!this.components.has(ctor)) this.components.set(ctor, new Set())

            this.components.get(ctor)!.add(component)
        }
    }

    /** Internal method to unregister a component from a component index */
    public unregisterComponent(component: Component) {
        for (const ctor of getConstructorChain(component)) {
            if (!this.components.get(ctor)!.delete(component)) throw new Error("Tried to unregister a component that was newer registered")
        }
    }

    /** Internal method to register entity for disposing */
    public registerEntity(entity: Entity) {
        this.entities.add(entity)
    }

    /** Internal method to unregister entity for disposing */
    public unregisterEntity(entity: Entity) {
        if (!this.entities.delete(entity)) throw new RangeError("Tried to unregister an entity not registered before")
    }

    public * getAllComponents() {
        for (const type of this.components.values()) {
            yield* type.values()
        }
    }

    public getAllEntities() {
        return this.entities.values()
    }

    public [DISPOSE] = () => {
        super[DISPOSE]()

        for (const [, eventEmitter] of this.events) { // Dispose all the EventEmitters
            eventEmitter.dispose()
        }

        for (const entity of this.entities) {
            entity.dispose()
        }

        this.events.clear()
    }

    public spawn(prefab: Prefab) {
        const builder = Entity.make().setSystem(this)
        return prefab(builder)
    }

    /** All EventEmitters, indexed by their event definition*/
    protected events = new Map<EntitySystem.EventDefinition<any>, EventEmitter<any>>()
    protected components = new Map<ComponentConstructor, Set<Component>>()
    protected entities = new Set<Entity>()
}

export namespace EntitySystem {
    /** Defines an event type to be used with an EntitySystem */
    export class EventDefinition<T> {
        constructor(
            public name: string
        ) { }
    }
}
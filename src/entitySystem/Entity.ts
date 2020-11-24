import { DISPOSE } from "../eventLib/Disposable";
import { EventListener } from "../eventLib/EventListener";
import { Component } from "./Component";
import { EntitySystem } from "./EntitySystem";

type AuxParameters<T> = T extends { new(entity: Entity, system: EntitySystem, ...args: infer U): any } ? U : never
type ConstructorReturnValue<T> = T extends { new(...args: any[]): infer U } ? U : never
type ComponentConstructor = {
    new(entity: Entity, system: EntitySystem, ...args: any[]): Component;
}

interface EntityBuilderBase<D> {
    addComponent<T extends ComponentConstructor>(ctor: T, callback?: (factory: (...args: AuxParameters<T>) => ConstructorReturnValue<T>) => void): D
}

/**
 * Entity builder that does not yet have a system / parent set → Cannot build an entity yet
 */
interface IncompleteEntityBuilder extends EntityBuilderBase<IncompleteEntityBuilder> {
    setParent(parent: Entity): ReadyEntityBuilder
    setSystem(system: EntitySystem): ReadyEntityBuilder
}

/**
 * Entity builder ready to build an entity
 */
interface ReadyEntityBuilder extends EntityBuilderBase<ReadyEntityBuilder> {
    build(): Entity
}

/**
 * Base for a callback to be passed to EntityBuilder.addComponent
 */
type AddComponentCallback = (factory: (...args: any[]) => any) => void

/**
 * A prefab is used to create the same entity multiple times. 
 */
export interface Prefab {
    (builder: ReadyEntityBuilder): void
}

export class Entity extends EventListener {
    /** Adds and initializes a component */
    public addComponent<T extends ComponentConstructor>(ctor: T): (...args: AuxParameters<T>) => ConstructorReturnValue<T> {
        if (this.components.has(ctor)) throw new RangeError(`Entity already contains a component of type "${ctor.name}"`)

        return (...args) => {
            const component = new ctor(this, this.system, ...args) as ConstructorReturnValue<T>

            this.components.set(ctor, component)
            component.init()

            return component
        }
    }

    /** Return a reference to a component with the provided type, throws RangeError if not found */
    public getComponent<T extends ComponentConstructor>(type: T): ConstructorReturnValue<T> {
        const component = this.components.get(type)
        if (component) return component as ConstructorReturnValue<T>
        else throw new RangeError(`Entity does not contain a component of type "${type.name}"`)
    }

    /** 
     * Adds the entity as a child. If the entity already had a parent, it gets removed from it
     */
    public addChild(entity: Entity): Entity;
    /**
     * Creates an entity from the prefab and adds it as a child
     */
    public addChild(prefab: Prefab): Entity;
    public addChild(ep: Entity | Prefab) {
        if (typeof ep == "function") {
            const builder = Entity.make().setParent(this)
            return ep(builder)
        } else {
            // If we already have the entity as a child, no need to do anything
            if (this.children.has(ep)) return ep

            if (ep.parent) { // If the entity already had a parent, remove it from it
                ep.parent.children.delete(ep)
            }

            ep.parent = this
            this.children.add(ep)

            return ep
        }
    }

    public [DISPOSE] = () => {
        // Remove this from its parent's children
        this.parent?.children.delete(this)
        // Remove all references so they don's get disposed, we don't own them
        Object.assign(this, { parent: null, system: null })
        super[DISPOSE]()

        for (const [, component] of this.components) { // Dispose all components
            component.dispose()
        }

        for (const child of this) { // Dispose all children
            child.dispose()
        }

    }

    /**
     * Iterates over all children
     */
    public [Symbol.iterator] = () => this.children[Symbol.iterator]()

    protected components = new Map<ComponentConstructor, Component>()
    protected children = new Set<Entity>()

    protected constructor(
        protected readonly system: EntitySystem,
        protected parent: Entity | null,
        componentCallbacks: Map<ComponentConstructor, AddComponentCallback>
    ) {
        super()

        for (const [ctor, callback] of componentCallbacks) { // Construct and add all components
            callback((...args) => {
                const component = new ctor(this, this.system, ...args)

                this.components.set(ctor, component)

                return component
            })
        }

        // Initialize all component ← component initialization is done
        // only after all children have been added, so it can use getComponent
        for (const [, component] of this.components) {
            component.init()
        }

        // Add us as a child to parent
        parent?.addChild(this)
    }

    /**
     * Creates an EntityBuilder
     */
    public static make(): IncompleteEntityBuilder {
        const componentCallbacks = new Map<ComponentConstructor, AddComponentCallback>()
        let parent: Entity | null = null
        let system: EntitySystem | null = null

        const builder: ReadyEntityBuilder & IncompleteEntityBuilder = {
            addComponent(ctor: ComponentConstructor, callback: AddComponentCallback = v => v()) {
                if (componentCallbacks.has(ctor)) throw new RangeError(`Entity already contains a component of type "${ctor.name}"`)

                componentCallbacks.set(ctor, callback)

                return this
            },

            setParent(newParent) {
                parent = newParent
                system = newParent.system

                return this
            },

            setSystem(newSystem) {
                parent = null
                system = newSystem

                return this
            },

            build() {
                return new Entity(system!, parent, componentCallbacks)
            }
        }

        return builder
    }
}
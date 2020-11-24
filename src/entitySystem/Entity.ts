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
interface EntityBuilder extends EntityBuilderBase<EntityBuilder> {
    setParent(parent: Entity): FinishedEntityBuilder
    setSystem(system: EntitySystem): FinishedEntityBuilder
}

interface FinishedEntityBuilder extends EntityBuilderBase<FinishedEntityBuilder> {
    build(): Entity
}

type AddComponentCallback = (factory: (...args: any[]) => any) => void;

export class Entity extends EventListener {
    public addComponent<T extends ComponentConstructor>(ctor: T): (...args: AuxParameters<T>) => ConstructorReturnValue<T> {
        if (this.components.has(ctor)) throw new RangeError(`Entity already contains a component of type "${ctor.name}"`)

        return (...args) => {
            const component = new ctor(this, this.system, ...args) as ConstructorReturnValue<T>

            this.components.set(ctor, component)
            component.init()

            return component
        }
    }

    public getComponent<T extends ComponentConstructor>(type: T): ConstructorReturnValue<T> {
        const component = this.components.get(type)
        if (component) return component as ConstructorReturnValue<T>
        else throw new RangeError(`Entity does not contain a component of type "${type.name}"`)
    }

    public [DISPOSE] = () => {
        super[DISPOSE]()
        for (const [, component] of this.components) {
            component.dispose()
        }
    }

    protected components = new Map<ComponentConstructor, Component>()

    protected constructor(
        protected readonly system: EntitySystem,
        protected parent: Entity | null,
        componentCallbacks: Map<ComponentConstructor, AddComponentCallback>
    ) {
        super()

        for (const [ctor, callback] of componentCallbacks) {
            callback((...args) => {
                const component = new ctor(this, this.system, ...args)

                this.components.set(ctor, component)

                return component
            })
        }

        for (const [, component] of this.components) {
            component.init()
        }
    }

    public static make(): EntityBuilder {
        const componentCallbacks = new Map<ComponentConstructor, AddComponentCallback>()
        let parent: Entity | null = null
        let system: EntitySystem | null = null

        const builder: FinishedEntityBuilder & EntityBuilder = {
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
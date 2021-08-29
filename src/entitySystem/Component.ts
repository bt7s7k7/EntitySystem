import { DISPOSE } from "../eventLib/Disposable"
import { EventListener } from "../eventLib/EventListener"
import { Entity } from "./Entity"
import { EntitySystem } from "./EntitySystem"
import { ComponentConstructor, ConstructorReturnValue } from "./util"

const COMPONENT_REF = Symbol("IS_COMPONENT_REF")

export abstract class Component extends EventListener {
    /**
     * Lifecycle hook that gets called after all components are added
     */
    public init() {
        Object.keys(this).forEach(key => {
            if (typeof (this as any)[key] == "object" && (this as any)[key] && COMPONENT_REF in (this as any)[key]) {
                (this as any)[key] = this.entity.getComponent((this as any)[key][COMPONENT_REF])
            }
        })
    }

    public [DISPOSE]() {
        this.system.unregisterComponent(this)
        this.entity.unregisterComponent(this)
        super[DISPOSE]()
    }

    public set(values: Partial<this>) {
        Object.assign(this, values)
        return this
    }

    constructor(
        public readonly entity: Entity,
        public readonly system: EntitySystem,
    ) {
        super()
        this.system.registerComponent(this)
    }

    /** Creates a component reference placeholder to be placed 
     *  in a component in constructor and will be filled in automatically */
    public static ref<T extends ComponentConstructor>(type: T): ConstructorReturnValue<T> {
        return {
            [COMPONENT_REF]: type
        } as ConstructorReturnValue<T>
    }
}
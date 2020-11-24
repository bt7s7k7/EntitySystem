import { DISPOSE } from "../eventLib/Disposable";
import { EventListener } from "../eventLib/EventListener";
import { Entity } from "./Entity";
import { EntitySystem } from "./EntitySystem";

export abstract class Component extends EventListener {
    /**
     * Lifecycle hook that gets called after all components are added
     */
    public init() {

    }

    public [DISPOSE]() {
        // Remove all references so they don't get disposed ← we don't own them
        Object.assign(this, { entity: null, system: null })
        super[DISPOSE]()
    }

    constructor(
        public readonly entity: Entity,
        protected readonly system: EntitySystem,
    ) {
        super()
    }
}
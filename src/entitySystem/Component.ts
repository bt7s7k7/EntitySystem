import { DISPOSE } from "../eventLib/Disposable";
import { EventListener } from "../eventLib/EventListener";
import { Entity } from "./Entity";
import { EntitySystem } from "./EntitySystem";

export abstract class Component extends EventListener {
    public init() {

    }

    public [DISPOSE]() {
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
import { EventListener } from "../eventLib/EventListener";
import { Entity } from "./Entity";
import { EntitySystem } from "./EntitySystem";

export abstract class Component extends EventListener {
    public init() {

    }

    constructor(
        public readonly entity: Entity,
        protected readonly system: EntitySystem,
    ) {
        super()
    }
}
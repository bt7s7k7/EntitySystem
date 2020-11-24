import { Disposable, DISPOSE } from "../eventLib/Disposable";
import { EventEmitter } from "../eventLib/EventEmitter";

export class EntitySystem extends Disposable {
    public on<T>(event: EntitySystem.EventDefinition<T>): EventEmitter<T> {
        if (!this.events.has(event)) {
            this.events.set(event, new EventEmitter())
        }

        return this.events.get(event)!
    }

    public [DISPOSE] = () => {
        super[DISPOSE]()

        for (const [, eventEmitter] of this.events) {
            eventEmitter.dispose()
        }

        this.events.clear()
    }

    protected events = new Map<EntitySystem.EventDefinition<any>, EventEmitter<any>>()
}

export namespace EntitySystem {
    export class EventDefinition<T> {
        constructor(
            public name: string
        ) { }
    }
}
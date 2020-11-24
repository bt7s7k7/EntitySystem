import { Disposable, DISPOSE } from "../eventLib/Disposable";
import { EventEmitter } from "../eventLib/EventEmitter";

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

    public [DISPOSE] = () => {
        super[DISPOSE]()

        for (const [, eventEmitter] of this.events) { // Dispose all the EventEmitters
            eventEmitter.dispose()
        }

        this.events.clear()
    }

    /** All EventEmitters, indexed by their event definition*/
    protected events = new Map<EntitySystem.EventDefinition<any>, EventEmitter<any>>()
}

export namespace EntitySystem {
    /** Defines an event type to be used with an EntitySystem */
    export class EventDefinition<T> {
        constructor(
            public name: string
        ) { }
    }
}
import { expect } from "chai";
import { Component } from "../../src/entitySystem/Component";
import { Entity } from "../../src/entitySystem/Entity";
import { EntitySystem } from "../../src/entitySystem/EntitySystem";
import { EventListener } from "../../src/eventLib/EventListener";
import { describeMember } from "../testUtil/describeMember";
import { tracker } from "../testUtil/tracker";

describeMember(() => EntitySystem, () => {
    describeMember(() => new EntitySystem().on, () => {
        it("Should create and return the correct event emitter", () => {
            const msg1Event = new EntitySystem.EventDefinition<string>("msg1Event")
            const msg2Event = new EntitySystem.EventDefinition<number>("msg1Event")

            const listener = new EventListener()

            const entitySystem = new EntitySystem()

            const msg1Tracker = tracker("msg1")
            const msg2Tracker = tracker("msg2")

            entitySystem.on(msg1Event).add(listener, (v) => {
                msg1Tracker.trigger()
                expect(v).to.equal("foo")
            })

            entitySystem.on(msg2Event).add(listener, (v) => {
                msg2Tracker.trigger()
                expect(v).to.equal(58)
            })

            entitySystem.on(msg1Event).emit("foo")
            msg1Tracker.check(1)
            msg2Tracker.check(0)

            entitySystem.on(msg2Event).emit(58)
            msg1Tracker.check(1)
            msg2Tracker.check(1)
        })

        it("Should properly emit events", () => {
            const entitySystem = new EntitySystem()

            const eventTracker = tracker("event")
            const updateEvent = new EntitySystem.EventDefinition<string>("update")

            class CustomComponent extends Component {
                protected update = this.system.on(updateEvent).add(this, (value) => {
                    expect(value).to.equal("foo")
                    eventTracker.trigger()
                })
            }

            const entity = Entity.make()
                .setSystem(entitySystem)
                .addComponent(CustomComponent)
                .build()

            eventTracker.check(0)

            entitySystem.on(updateEvent).emit("foo")

            eventTracker.check(1)

            entity.dispose()

            eventTracker.check(1)
        })
    })
})
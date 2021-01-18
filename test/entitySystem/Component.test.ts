import { expect } from "chai";
import { Component } from "../../src/entitySystem/Component";
import { Entity } from "../../src/entitySystem/Entity";
import { EntitySystem } from "../../src/entitySystem/EntitySystem";
import { describeMember } from "../testUtil/describeMember";
import { tracker } from "../testUtil/tracker";

describeMember(() => Component, () => {
    it("Should fill in references to components", () => {
        const system = new EntitySystem()

        const execTracker = tracker("exec")

        class ComponentA extends Component { }
        class ComponentB extends Component {
            public a = Component.ref(ComponentA)

            public init() {
                super.init()

                execTracker.trigger()
                expect(this.a).to.be.instanceOf(ComponentA)
            }
        }

        Entity.make()
            .setSystem(system)
            .addComponent(ComponentB)
            .addComponent(ComponentA)
            .build()

        execTracker.check()
    })
})
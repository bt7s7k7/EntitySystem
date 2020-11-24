import { expect } from "chai"
import { Component } from "../../src/entitySystem/Component"
import { Entity } from "../../src/entitySystem/Entity"
import { EntitySystem } from "../../src/entitySystem/EntitySystem"
import { describeMember } from "../testUtil/describeMember"
import { tracker } from "../testUtil/tracker"

describeMember(() => Entity, () => {
    describeMember(() => Entity.make, () => {
        it("Should create the correct entity", () => {
            const component1Tracker = tracker("component1")

            class Component1 extends Component {
                public init = () => {
                    super.init()
                    expect(this.value).to.equal("foo")
                    component1Tracker.trigger()
                }

                constructor(entity: Entity, system: EntitySystem, public readonly value: string) {
                    super(entity, system)
                }
            }

            const entitySystem = new EntitySystem()

            const entity1 = Entity.make()
                .setSystem(entitySystem)
                .addComponent(Component1, v => v("foo"))
                .build()

            component1Tracker.check()

            expect(entity1).to.have.property("system", entitySystem)
            expect(entity1).to.have.property("parent", null)
            expect(entity1.getComponent(Component1)).be.instanceOf(Component1)

            const entity2 = Entity.make()
                .setParent(entity1)
                .build()

            component1Tracker.check()

            expect(entity2).to.have.property("system", entitySystem)
            expect(entity2).to.have.property("parent", entity1)
            expect(() => entity2.getComponent(Component1)).to.throw(RangeError)
        })

        it("Should initialize the components after creation", () => {
            const componentTracker = tracker("component1")

            class Component1 extends Component { }

            class Component2 extends Component {
                public init = () => {
                    super.init()
                    expect(this.entity.getComponent(Component1)).to.be.instanceOf(Component1)
                    componentTracker.trigger()
                }
            }

            const entitySystem = new EntitySystem()

            const entity = Entity.make()
                .setSystem(entitySystem)
                .addComponent(Component1)
                .addComponent(Component2)
                .build()

            componentTracker.check()
        })
    })
})
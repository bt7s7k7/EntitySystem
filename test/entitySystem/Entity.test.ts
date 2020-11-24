import { expect } from "chai"
import { Component } from "../../src/entitySystem/Component"
import { Entity, Prefab } from "../../src/entitySystem/Entity"
import { EntitySystem } from "../../src/entitySystem/EntitySystem"
import { DISPOSE } from "../../src/eventLib/Disposable"
import { describeMember } from "../testUtil/describeMember"
import { mockInstance } from "../testUtil/mock"
import { tracker } from "../testUtil/tracker"

describeMember(() => Entity, () => {
    describeMember(() => mockInstance<Entity>().dispose, () => {
        it("Should dispose of all components", () => {
            const componentTracker = tracker("component1")

            class Component1 extends Component {
                public [DISPOSE]() {
                    super[DISPOSE]()
                    componentTracker.trigger()
                }
            }

            const entitySystem = new EntitySystem()

            const entity = Entity.make()
                .setSystem(entitySystem)
                .addComponent(Component1)
                .build()

            componentTracker.check(0)

            entity.dispose()

            componentTracker.check(1)
        })

        it("Should dispose all children", () => {
            const componentTracker = tracker("component1")

            class Component1 extends Component {
                public [DISPOSE]() {
                    super[DISPOSE]()
                    componentTracker.trigger()
                }
            }

            const entitySystem = new EntitySystem()

            const entity = Entity.make()
                .setSystem(entitySystem)
                .addComponent(Component1)
                .build()

            entity.addChild(v => v.addComponent(Component1).build())
            entity.addChild(v => v.addComponent(Component1).build())
            entity.addChild(v => v.addComponent(Component1).build())

            entity.dispose()

            componentTracker.check(4)
        })

        it("Should remove the entity from its parent", () => {
            const entitySystem = new EntitySystem()

            const parent = Entity.make()
                .setSystem(entitySystem)
                .build()

            const child = parent.addChild(v => v.build())

            expect([...parent]).to.have.members([child])

            child.dispose()

            expect([...parent]).to.be.empty
        })
    })

    describeMember(() => mockInstance<Entity>().addChild, () => {
        it("Should add a child to an entity", () => {
            const entitySystem = new EntitySystem()

            const entity1 = Entity.make()
                .setSystem(entitySystem)
                .build()

            const entity2 = Entity.make()
                .setSystem(entitySystem)
                .build()

            expect(entity1.addChild(entity2)).to.equal(entity2)

            for (const child of entity1) {
                expect(child).to.equal(entity2)
            }
        })

        it("Should add a child from a prefab to an entity", () => {
            const entitySystem = new EntitySystem()

            const parent = Entity.make()
                .setSystem(entitySystem)
                .build()

            const expectedChildren: Entity[] = []
            const prefab: Prefab = builder => {
                const child = builder.build()
                expectedChildren.push(child)
            }

            parent.addChild(prefab)
            parent.addChild(prefab)
            parent.addChild(prefab)

            expect([...parent]).to.have.members(expectedChildren)

        })
    })

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
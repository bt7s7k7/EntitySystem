import { expect } from "chai"
import { Component } from "../../../src/entitySystem/Component"
import { Entity } from "../../../src/entitySystem/Entity"
import { EntitySystem } from "../../../src/entitySystem/EntitySystem"
import { ComponentManifest } from "../../../src/entitySystem/serialization/ComponentManifest"
import { ComponentRegistry } from "../../../src/entitySystem/serialization/ComponentRegistry"
import { EntitySaver, NonSerializableParentError, SerializableComponentNotRegisteredError } from "../../../src/entitySystem/serialization/EntitySaver"
import { SaveType } from "../../../src/entitySystem/serialization/SaveType"
import { describeMember } from "../../testUtil/describeMember"
import { mockInstance } from "../../testUtil/mock"

describe("serialization", () => {
    describeMember(() => EntitySaver, () => {

        function prepare() {
            class Foo extends Component {
                constructor(entity: Entity, system: EntitySystem, public readonly name = "") {
                    super(entity, system)
                }

                public static [ComponentManifest.MANIFEST] = new ComponentManifest(Foo, [
                    { name: "name", type: SaveType.string }
                ])
            }

            class Boo extends Component {
                constructor(entity: Entity, system: EntitySystem, public readonly label = "") {
                    super(entity, system)
                }

                public static [ComponentManifest.MANIFEST] = new ComponentManifest(Boo, [
                    { name: "label", type: SaveType.string }
                ])
            }

            class Noo extends Component {
                constructor(entity: Entity, system: EntitySystem, public readonly title = "") {
                    super(entity, system)
                }

                public static [ComponentManifest.MANIFEST] = new ComponentManifest(Noo, [
                    { name: "title", type: SaveType.string }
                ])
            }

            class Plain extends Component {
                constructor(entity: Entity, system: EntitySystem, public readonly title = "") {
                    super(entity, system)
                }
            }

            const registry = new ComponentRegistry()

            registry.register(Foo)
            registry.register(Boo)

            const saver = new EntitySaver(registry)

            const system = new EntitySystem()

            return { Foo, Boo, Noo, Plain, registry, saver, system }
        }

        describeMember(() => mockInstance<EntitySaver>().save, () => {
            it("Should save all serializable components in the system", () => {
                const { Foo, Boo, saver, system } = prepare()

                Entity.make().setSystem(system)
                    .addComponent(Foo, v => v("Foo1"))
                    .build()

                const parent = Entity.make().setSystem(system)
                    .addComponent(Boo, v => v("Foo2"))
                    .build()

                Entity.make().setParent(parent)
                    .addComponent(Foo, v => v("Foo3"))
                    .build()

                const saveData = saver.save(system)
                expect(saveData.entities).to.have.lengthOf(3)

                const foo1 = saveData.entities.find(v => v.components[0].data.name == "Foo1")!
                expect(foo1).to.not.be.undefined
                expect(foo1.parent).to.be.null
                expect(foo1.components).to.be.lengthOf(1)
                expect(foo1.components[0].name).to.equal("Foo")

                const foo2 = saveData.entities.find(v => v.components[0].data.label == "Foo2")!
                expect(foo2).to.not.be.undefined
                expect(foo2.parent).to.be.null
                expect(foo2.components).to.be.lengthOf(1)
                expect(foo2.components[0].name).to.equal("Boo")

                const foo3 = saveData.entities.find(v => v.components[0].data.name == "Foo3")!
                expect(foo3).to.not.be.undefined
                expect(foo3.parent).to.equal(foo2.id)
                expect(foo3.components).to.be.lengthOf(1)
                expect(foo3.components[0].name).to.equal("Foo")
            })

            it("Should throw when serializing a not registered component", () => {
                const { system, Foo, Noo, saver } = prepare()

                Entity.make().setSystem(system)
                    .addComponent(Foo, v => v("Foo1"))
                    .build()

                Entity.make().setSystem(system)
                    .addComponent(Noo, v => v("Foo2"))
                    .build()

                expect(() => {
                    saver.save(system)
                }).to.throw(SerializableComponentNotRegisteredError)
            })

            it("Should not serialize not serializable components", () => {
                const { system, Foo, Plain, saver } = prepare()

                Entity.make().setSystem(system)
                    .addComponent(Foo, v => v("Foo1"))
                    .build()

                Entity.make().setSystem(system)
                    .addComponent(Plain, v => v("Foo2"))
                    .build()

                const saveData = saver.save(system)

                expect(saveData.entities).to.have.lengthOf(1)
                expect(saveData.entities[0].components[0].name).to.equal("Foo")
            })

            it("Should throw when a parent of a serialized entity is not serialized", () => {
                const { system, Foo, Plain, saver } = prepare()

                const parent = Entity.make().setSystem(system)
                    .addComponent(Plain, v => v("Foo2"))
                    .build()

                Entity.make().setParent(parent)
                    .addComponent(Foo, v => v("Foo1"))
                    .build()

                expect(() => {
                    saver.save(system)
                }).to.throw(NonSerializableParentError)
            })
            it("Should serialize component references")
        })
    })
})
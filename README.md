# Entity System
Generic entity system. Defines entities containing components, automatically manages disposing and event dispatch.
## Examples
Events:
```ts
const entitySystem = new EntitySystem()
const updateEvent = new EntitySystem.EventDefinition<{ deltaTime: number }>("update")

class CustomComponent extends Component {
    protected update = this.system.on(updateEvent).add(this, ({ deltaTime }) => {
        // [...]
    })
}

const entity = Entity.make()
    .setSystem(entitySystem)
    .addComponent(CustomComponent)
    .build()

entitySystem.on(updateEvent).emit({ deltaTime: 200 })
```
Adding children:
```ts
const parent = Entity.make()
    .setSystem(entitySystem)
    .build()

const expectedChildren: Entity[] = []
const prefab: Prefab = b => b
    .addComponent(CameraComponent)
    .addComponent(PlayerControllerComponent)

parent.addChild(prefab)
parent.addChild(prefab)
parent.addChild(prefab)
```
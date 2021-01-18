import { Component } from "./Component";
import { Entity } from "./Entity";
import { EntitySystem } from "./EntitySystem";

export type ConstructorReturnValue<T> = T extends { new(...args: any[]): infer U; } ? U : never
export type ComponentConstructor = {
    new(entity: Entity, system: EntitySystem, ...args: any[]): Component
};

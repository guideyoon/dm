import { MeshBuilder, StandardMaterial, Color3, Vector3, Scene, Mesh } from '@babylonjs/core';

export class Item {
    public name: string;
    public mesh: Mesh;
    public isPicked: boolean = false;

    constructor(name: string, mesh: Mesh) {
        this.name = name;
        this.mesh = mesh;
        // Store reference to this Item in mesh metadata for lookup during pickup
        (mesh as any).metadata = { item: this, picked: false };
    }

    /**
     * Creates a simple sphere representing the item at the given position.
     * @param name Name of the item (e.g., "Wood", "Stone")
     * @param position Position where the item should appear
     * @param scene Babylon.js scene to add the mesh to
     * @returns The created Item instance
     */
    static createItem(name: string, position: Vector3, scene: Scene): Item {
        const sphere = MeshBuilder.CreateSphere(`${name}_item`, { diameter: 0.3 }, scene);
        sphere.position = position.clone();
        const mat = new StandardMaterial(`${name}_mat`, scene);
        mat.diffuseColor = name === 'Wood' ? new Color3(0.4, 0.2, 0.1) : new Color3(0.5, 0.5, 0.5);
        sphere.material = mat;
        sphere.isPickable = false; // Items are collected via proximity, not direct clicking
        return new Item(name, sphere);
    }
}

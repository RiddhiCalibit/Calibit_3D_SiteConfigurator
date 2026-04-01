# Local GLB Models

To use your own 3D models permanently in the application:

1. Place your `.glb` files in this directory (`/public/models/`).
2. Update the `DEFAULT_LIBRARY` array in `src/types.ts` to include your model.
3. Use the relative path starting from the root, e.g., `modelUrl: "/models/my-model.glb"`.

Example entry in `src/types.ts`:
{ id: "my_model", name: "My Custom Model", width: 5, depth: 5, height: 5, color: "#FF0000", category: "custom", modelUrl: "/models/my-model.glb" }

Alternatively, you can use the "Add GLB" button in the application sidebar to upload models dynamically during your session.


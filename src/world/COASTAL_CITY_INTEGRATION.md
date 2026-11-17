# THE LAST 30 - Coastal City Integration

New module:
src/world/CoastalCityMap.js

This module exports:
CoastalCityMap

It expects an existing THREE.Scene.

Example integration:

import CoastalCityMap from './CoastalCityMap.js';

Inside your Environment constructor, after your scene exists:

this.coastalCity = new CoastalCityMap(scene);

Use the actual scene variable/property from your project.
Do not assume it is named `scene` without inspecting your code.

To retrieve generated collision rectangles:

const boxes = this.coastalCity.getCollisionBoxes();

Each collision object contains:
minX, maxX, minZ, maxZ, height

Adapt these to your existing collision system.
Do not replace your existing player collision logic blindly.

To change environmental stage later:

this.coastalCity.setStage(2);

Stages 1-4 are available.

IMPORTANT:
The module is not automatically connected to the game loop.
It must be instantiated once from the existing Environment setup.
Do not instantiate it every frame.

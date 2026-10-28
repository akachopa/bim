# Skema BIM internal 1.0.0

Unit internal: **millimeter**. Renderer: `1000 mm = 1 unit Babylon`.

## Elemen

| Internal | IFC |
| --- | --- |
| Level | IfcBuildingStorey |
| Wall | IfcWall |
| Column | IfcColumn |
| Beam | IfcBeam |
| Slab | IfcSlab |
| Door | IfcDoor |
| Window | IfcWindow |

Door dan window wajib `hostWallId`. Jika wall dihapus, bukaan ikut terhapus.

Semua perubahan model melalui Command Pattern (undo/redo). Geometry digenerate ulang dari data semantik.

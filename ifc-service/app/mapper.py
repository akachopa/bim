IFC_MAP = {
    "wall": "IfcWall",
    "column": "IfcColumn",
    "beam": "IfcBeam",
    "slab": "IfcSlab",
    "door": "IfcDoor",
    "window": "IfcWindow",
}


def summarize_document(document: dict) -> dict:
    elements = document.get("elements") or []
    counts: dict[str, int] = {}
    for element in elements:
        ifc = IFC_MAP.get(element.get("type"), "IfcBuildingElementProxy")
        counts[ifc] = counts.get(ifc, 0) + 1
    return {
        "schemaVersion": document.get("schemaVersion"),
        "levels": len(document.get("levels") or []),
        "grids": len(document.get("grids") or []),
        "elements": len(elements),
        "byClass": counts,
    }

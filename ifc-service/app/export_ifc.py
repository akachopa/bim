from .mapper import IFC_MAP, summarize_document


def document_to_ifc(document: dict) -> str:
    """Emit a minimal IFC SPF for the internal BIM document (viewer-grade, not round-trip)."""
    lines = [
        "ISO-10303-21;",
        "HEADER;",
        "FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');",
        "FILE_NAME('bim-studio.ifc','',('BIM Studio'),('Akademi BIM Nusantara'),'BIM Training Platform','','');",
        "FILE_SCHEMA(('IFC4'));",
        "ENDSEC;",
        "DATA;",
        "#1=IFCPROJECT('2Y$8n0$v1F6x8dK2','','BIM Project',$,$,$,$,(#10),#20);",
        "#10=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#11,$);",
        "#11=IFCAXIS2PLACEMENT3D(#12,$,$);",
        "#12=IFCCARTESIANPOINT((0.,0.,0.));",
        "#20=IFCUNITASSIGNMENT((#21));",
        "#21=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);",
    ]
    n = 100
    for level in document.get("levels") or []:
        n += 1
        name = (level.get("name") or "Level").replace("'", "")
        elev = float(level.get("elevation") or 0)
        lines.append(f"#{n}=IFCBUILDINGSTOREY('{_guid()}','','{name}',$,$,$,$,$,.ELEMENT.,{elev});")
    for element in document.get("elements") or []:
        n += 1
        ifc = IFC_MAP.get(element.get("type"), "IfcBuildingElementProxy")
        name = (element.get("name") or element.get("type") or "Element").replace("'", "")
        lines.append(f"#{n}={ifc.upper()}('{_guid()}','','{name}',$,$,$,$,$,$);")
    lines += ["ENDSEC;", "END-ISO-10303-21;"]
    _ = summarize_document(document)
    return "\n".join(lines)


def _guid() -> str:
    return "2xU$000000000000000000"

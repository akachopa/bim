from app.export_ifc import document_to_ifc
from app.mapper import summarize_document


def test_export_contains_wall():
    doc = {
        "schemaVersion": "1.0.0",
        "levels": [{"id": "1", "name": "Level 1", "elevation": 0}],
        "elements": [{"type": "wall", "name": "Wall 1"}],
    }
    ifc = document_to_ifc(doc)
    assert "IFCWALL" in ifc
    assert "IFCBUILDINGSTOREY" in ifc
    summary = summarize_document(doc)
    assert summary["byClass"]["IfcWall"] == 1

from .mapper import summarize_document


def validate_document(document: dict) -> dict:
    summary = summarize_document(document)
    errors = []
    if summary["levels"] < 1:
        errors.append("Model tanpa IfcBuildingStorey / level.")
    if summary["elements"] == 0:
        errors.append("Tidak ada elemen BIM.")
    return {"valid": len(errors) == 0, "errors": errors, "summary": summary}

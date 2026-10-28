def parse_ifc_summary(ifc_text: str) -> dict:
    counts: dict[str, int] = {}
    for line in ifc_text.splitlines():
        upper = line.upper()
        for key in ("IFCWALL", "IFCCOLUMN", "IFCBEAM", "IFCSLAB", "IFCDOOR", "IFCWINDOW", "IFCBUILDINGSTOREY"):
            if key in upper:
                counts[key] = counts.get(key, 0) + 1
    return {"entities": counts, "lines": len(ifc_text.splitlines())}

"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Import/Export Service

Creator: Trapzzy
Contact: traphubs@outlook.com

KML, GeoJSON, and GPX file parsing and generation
for location data exchange with GIS systems.
"""

import json
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import uuid
import io

from sqlalchemy.orm import Session

from app.models.location import Location, Geofence


# ============================================================
# GeoJSON
# ============================================================

def export_geojson(
    db: Session,
    user_id: uuid.UUID,
    location_ids: Optional[List[uuid.UUID]] = None,
    include_geofences: bool = True,
) -> Dict[str, Any]:
    """
    Export locations as GeoJSON FeatureCollection.

    Args:
        db: Database session
        user_id: User ID to filter locations
        location_ids: Optional list of specific location IDs to export
        include_geofences: Whether to include geofence polygons

    Returns:
        GeoJSON FeatureCollection dictionary
    """
    query = db.query(Location).filter(Location.user_id == user_id)
    if location_ids:
        query = query.filter(Location.id.in_(location_ids))

    locations = query.all()
    features = []

    for loc in locations:
        properties = {
            "id": str(loc.id),
            "name": loc.name,
            "address": loc.address,
            "is_monitored": loc.is_monitored,
            "tags": loc.tags,
            "notes": loc.notes,
            "zoom_level": float(loc.zoom_level) if loc.zoom_level else 15.0,
            "created_at": loc.created_at.isoformat() if loc.created_at else None,
        }

        point = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(loc.longitude), float(loc.latitude)],
            },
            "properties": properties,
        }
        features.append(point)

        if include_geofences and loc.geofences:
            for gf in loc.geofences:
                if gf.is_active and gf.coordinates:
                    try:
                        coords = json.loads(gf.coordinates)
                        if isinstance(coords, list) and len(coords) >= 3:
                            first = coords[0]
                            if isinstance(first, (list, tuple)) and len(first) >= 2:
                                if abs(first[0]) > 90:
                                    geo_coords = [[float(c[0]), float(c[1])] for c in coords]
                                else:
                                    geo_coords = [[float(c[1]), float(c[0])] for c in coords]

                                if geo_coords[0] != geo_coords[-1]:
                                    geo_coords.append(geo_coords[0])

                                features.append({
                                    "type": "Feature",
                                    "geometry": {
                                        "type": "Polygon",
                                        "coordinates": [geo_coords],
                                    },
                                    "properties": {
                                        "id": str(gf.id),
                                        "name": gf.name,
                                        "location_id": str(loc.id),
                                        "location_name": loc.name,
                                        "type": "geofence",
                                        "alert_on_change": gf.alert_on_change,
                                    },
                                })
                    except (json.JSONDecodeError, ValueError):
                        pass

    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "total_features": len(features),
            "total_locations": len(locations),
            "generator": "God Eyes Platform",
        },
    }


def import_geojson(
    db: Session,
    user_id: uuid.UUID,
    geojson_data: Dict[str, Any],
) -> Tuple[List[Location], List[str]]:
    """
    Import locations from a GeoJSON FeatureCollection.

    Args:
        db: Database session
        user_id: User ID to associate imported locations
        geojson_data: Parsed GeoJSON dictionary

    Returns:
        Tuple of (created_locations, error_messages)
    """
    created = []
    errors = []

    if geojson_data.get("type") != "FeatureCollection":
        errors.append("Invalid GeoJSON: expected FeatureCollection type")
        return created, errors

    features = geojson_data.get("features", [])

    for i, feature in enumerate(features):
        try:
            geometry = feature.get("geometry", {})
            properties = feature.get("properties", {})

            if geometry.get("type") == "Point":
                coords = geometry.get("coordinates", [])
                if len(coords) >= 2:
                    location = Location(
                        user_id=user_id,
                        name=properties.get("name", f"Imported Location {i+1}"),
                        address=properties.get("address"),
                        latitude=coords[1],
                        longitude=coords[0],
                        zoom_level=properties.get("zoom_level", 15.0),
                        tags=properties.get("tags"),
                        notes=properties.get("notes"),
                    )
                    db.add(location)
                    created.append(location)
            elif geometry.get("type") == "Polygon":
                continue
        except Exception as e:
            errors.append(f"Feature {i+1}: {str(e)}")

    if created:
        db.commit()
        for loc in created:
            db.refresh(loc)

    return created, errors


# ============================================================
# KML
# ============================================================

def export_kml(
    db: Session,
    user_id: uuid.UUID,
    location_ids: Optional[List[uuid.UUID]] = None,
    include_geofences: bool = True,
) -> str:
    """
    Export locations as KML (Keyhole Markup Language) for Google Earth.

    Args:
        db: Database session
        user_id: User ID to filter locations
        location_ids: Optional specific location IDs
        include_geofences: Whether to include geofence polygons

    Returns:
        KML XML string
    """
    ns = "http://www.opengis.net/kml/2.2"
    ET.register_namespace("", ns)

    kml = ET.Element(f"{{{ns}}}kml")
    document = ET.SubElement(kml, f"{{{ns}}}Document")

    ET.SubElement(document, f"{{{ns}}}name").text = "God Eyes Locations"
    ET.SubElement(document, f"{{{ns}}}description").text = (
        f"Exported from God Eyes Platform at {datetime.now(timezone.utc).isoformat()}"
    )

    query = db.query(Location).filter(Location.user_id == user_id)
    if location_ids:
        query = query.filter(Location.id.in_(location_ids))

    locations = query.all()

    for loc in locations:
        placemark = ET.SubElement(document, f"{{{ns}}}Placemark")
        ET.SubElement(placemark, f"{{{ns}}}name").text = loc.name
        ET.SubElement(placemark, f"{{{ns}}}description").text = (
            f"Address: {loc.address or 'N/A'}\n"
            f"Monitored: {loc.is_monitored}\n"
            f"Tags: {loc.tags or 'N/A'}\n"
            f"Notes: {loc.notes or 'N/A'}"
        )

        point = ET.SubElement(placemark, f"{{{ns}}}Point")
        ET.SubElement(point, f"{{{ns}}}coordinates").text = (
            f"{float(loc.longitude)},{float(loc.latitude)},0"
        )

        if include_geofences and loc.geofences:
            for gf in loc.geofences:
                if gf.is_active and gf.coordinates:
                    try:
                        coords = json.loads(gf.coordinates)
                        if isinstance(coords, list) and len(coords) >= 3:
                            gf_placemark = ET.SubElement(document, f"{{{ns}}}Placemark")
                            ET.SubElement(gf_placemark, f"{{{ns}}}name").text = f"Geofence: {gf.name}"
                            ET.SubElement(gf_placemark, f"{{{ns}}}description").text = (
                                f"Geofence for {loc.name}\nAlert on change: {gf.alert_on_change}"
                            )

                            style = ET.SubElement(gf_placemark, f"{{{ns}}}Style")
                            poly_style = ET.SubElement(style, f"{{{ns}}}PolyStyle")
                            ET.SubElement(poly_style, f"{{{ns}}}color").text = "7f0000ff"
                            ET.SubElement(poly_style, f"{{{ns}}}fill").text = "1"
                            ET.SubElement(poly_style, f"{{{ns}}}outline").text = "1"

                            polygon = ET.SubElement(gf_placemark, f"{{{ns}}}Polygon")
                            ET.SubElement(polygon, f"{{{ns}}}tessellate").text = "1"
                            outer = ET.SubElement(polygon, f"{{{ns}}}outerBoundaryIs")
                            linear_ring = ET.SubElement(outer, f"{{{ns}}}LinearRing")

                            coord_strs = []
                            for c in coords:
                                if isinstance(c, (list, tuple)) and len(c) >= 2:
                                    if abs(c[0]) > 90:
                                        coord_strs.append(f"{float(c[0])},{float(c[1])},0")
                                    else:
                                        coord_strs.append(f"{float(c[1])},{float(c[0])},0")

                            ET.SubElement(linear_ring, f"{{{ns}}}coordinates").text = (
                                " ".join(coord_strs)
                            )
                    except (json.JSONDecodeError, ValueError):
                        pass

    return ET.tostring(kml, encoding="unicode", xml_declaration=False)


def import_kml(
    db: Session,
    user_id: uuid.UUID,
    kml_content: str,
) -> Tuple[List[Location], List[str]]:
    """
    Import locations from KML content.

    Args:
        db: Database session
        user_id: User ID to associate imported locations
        kml_content: Raw KML XML string

    Returns:
        Tuple of (created_locations, error_messages)
    """
    created = []
    errors = []
    ns = {"kml": "http://www.opengis.net/kml/2.2"}

    try:
        root = ET.fromstring(kml_content)
    except ET.ParseError as e:
        errors.append(f"Invalid KML: {str(e)}")
        return created, errors

    placemarks = root.findall(".//kml:Placemark", ns)

    for i, placemark in enumerate(placemarks):
        try:
            name_elem = placemark.find("kml:name", ns)
            desc_elem = placemark.find("kml:description", ns)
            name = name_elem.text if name_elem is not None else f"Imported Location {i+1}"
            description = desc_elem.text if desc_elem is not None else ""

            point_elem = placemark.find(".//kml:Point/kml:coordinates", ns)
            if point_elem is not None and point_elem.text:
                coords = point_elem.text.strip().split(",")
                if len(coords) >= 2:
                    longitude = float(coords[0])
                    latitude = float(coords[1])

                    location = Location(
                        user_id=user_id,
                        name=name,
                        address=description[:500] if description else None,
                        latitude=latitude,
                        longitude=longitude,
                        zoom_level=15.0,
                    )
                    db.add(location)
                    created.append(location)
        except Exception as e:
            errors.append(f"Placemark {i+1}: {str(e)}")

    if created:
        db.commit()
        for loc in created:
            db.refresh(loc)

    return created, errors


# ============================================================
# GPX
# ============================================================

def export_gpx(
    db: Session,
    user_id: uuid.UUID,
    location_ids: Optional[List[uuid.UUID]] = None,
) -> str:
    """
    Export locations as GPX (GPS Exchange Format) waypoints.

    Args:
        db: Database session
        user_id: User ID to filter locations
        location_ids: Optional specific location IDs

    Returns:
        GPX XML string
    """
    ns = "http://www.topografix.com/GPX/1/1"
    xsi = "http://www.w3.org/2001/XMLSchema-instance"
    ET.register_namespace("", ns)
    ET.register_namespace("xsi", xsi)

    gpx = ET.Element(
        f"{{{ns}}}gpx",
        attrib={
            f"{{{xsi}}}schemaLocation": f"{ns} http://www.topografix.com/GPX/1/1/gpx.xsd",
            "version": "1.1",
            "creator": "God Eyes Platform",
        },
    )

    metadata = ET.SubElement(gpx, f"{{{ns}}}metadata")
    ET.SubElement(metadata, f"{{{ns}}}name").text = "God Eyes Locations"
    ET.SubElement(metadata, f"{{{ns}}}time").text = datetime.now(timezone.utc).isoformat()

    query = db.query(Location).filter(Location.user_id == user_id)
    if location_ids:
        query = query.filter(Location.id.in_(location_ids))

    locations = query.all()

    for loc in locations:
        wpt = ET.SubElement(
            gpx,
            f"{{{ns}}}wpt",
            attrib={"lat": str(float(loc.latitude)), "lon": str(float(loc.longitude))},
        )
        ET.SubElement(wpt, f"{{{ns}}}name").text = loc.name
        if loc.address:
            ET.SubElement(wpt, f"{{{ns}}}desc").text = loc.address
        if loc.notes:
            ET.SubElement(wpt, f"{{{ns}}}cmt").text = loc.notes
        ET.SubElement(wpt, f"{{{ns}}}time").text = (
            loc.created_at.isoformat() if loc.created_at else datetime.now(timezone.utc).isoformat()
        )

        sym = ET.SubElement(wpt, f"{{{ns}}}sym")
        sym.text = "Flag, Red" if loc.is_monitored else "Waypoint"

    return ET.tostring(gpx, encoding="unicode", xml_declaration=False)


def import_gpx(
    db: Session,
    user_id: uuid.UUID,
    gpx_content: str,
) -> Tuple[List[Location], List[str]]:
    """
    Import locations from GPX waypoints.

    Args:
        db: Database session
        user_id: User ID to associate imported locations
        gpx_content: Raw GPX XML string

    Returns:
        Tuple of (created_locations, error_messages)
    """
    created = []
    errors = []
    ns = {"gpx": "http://www.topografix.com/GPX/1/1"}

    try:
        root = ET.fromstring(gpx_content)
    except ET.ParseError as e:
        errors.append(f"Invalid GPX: {str(e)}")
        return created, errors

    waypoints = root.findall(".//gpx:wpt", ns)

    for i, wpt in enumerate(waypoints):
        try:
            lat = float(wpt.get("lat", 0))
            lon = float(wpt.get("lon", 0))

            name_elem = wpt.find("gpx:name", ns)
            desc_elem = wpt.find("gpx:desc", ns)
            cmt_elem = wpt.find("gpx:cmt", ns)

            name = name_elem.text if name_elem is not None else f"Waypoint {i+1}"
            description = desc_elem.text if desc_elem is not None else None
            notes = cmt_elem.text if cmt_elem is not None else None

            location = Location(
                user_id=user_id,
                name=name,
                address=description,
                latitude=lat,
                longitude=lon,
                zoom_level=15.0,
                notes=notes,
            )
            db.add(location)
            created.append(location)
        except Exception as e:
            errors.append(f"Waypoint {i+1}: {str(e)}")

    if created:
        db.commit()
        for loc in created:
            db.refresh(loc)

    return created, errors


# ============================================================
# Format Detection
# ============================================================

def detect_format(content: str) -> Optional[str]:
    """
    Auto-detect the format of geospatial data content.

    Args:
        content: Raw file content string

    Returns:
        Detected format string ('geojson', 'kml', 'gpx') or None
    """
    content_stripped = content.strip()

    if content_stripped.startswith("{"):
        try:
            data = json.loads(content_stripped)
            if data.get("type") == "FeatureCollection":
                return "geojson"
            elif data.get("type") == "Feature":
                return "geojson"
        except (json.JSONDecodeError, ValueError):
            pass

    if content_stripped.startswith("<?xml") or content_stripped.startswith("<"):
        if "<kml" in content_stripped.lower() or "<Placemark" in content_stripped:
            return "kml"
        if "<gpx" in content_stripped.lower() or "<wpt" in content_stripped:
            return "gpx"

    return None

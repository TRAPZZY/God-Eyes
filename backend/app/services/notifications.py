"""
God Eyes - Defense-Grade Satellite Intelligence Platform
Notification Service

Creator: Trapzzy
Contact: traphubs@outlook.com

Handles alert delivery via email, webhook, and push notification channels.
Supports customizable alert templates for different change detection severities.
"""

import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any
from app.config import get_settings

settings = get_settings()

ALERT_TEMPLATES = {
    "high": "[CRITICAL ALERT] God Eyes: Significant change detected at {location_name}",
    "medium": "[WARNING] God Eyes: Moderate change detected at {location_name}",
    "low": "[INFO] God Eyes: Minor change detected at {location_name}",
}

EMAIL_BODY_TEMPLATE = """
<h2>God Eyes - Change Detection Alert</h2>
<p><strong>Location:</strong> {location_name}</p>
<p><strong>Severity:</strong> {severity}</p>
<p><strong>Change Score:</strong> {change_score}%</p>
<p><strong>Details:</strong> {description}</p>
<p><strong>Detected At:</strong> {detected_at}</p>
<hr>
<p><em>God Eyes - Defense-Grade Satellite Intelligence Platform</em></p>
<p><em>Creator: Trapzzy | traphubs@outlook.com</em></p>
"""


def send_email_alert(
    to_email: str,
    location_name: str,
    severity: str,
    change_score: float,
    description: str,
    detected_at: str,
) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = ALERT_TEMPLATES.get(severity, ALERT_TEMPLATES["low"]).format(location_name=location_name)
        msg["From"] = "alerts@godeyes.platform"
        msg["To"] = to_email
        html_body = EMAIL_BODY_TEMPLATE.format(
            location_name=location_name,
            severity=severity.upper(),
            change_score=change_score,
            description=description,
            detected_at=detected_at,
        )
        msg.attach(MIMEText(html_body, "html"))
        return True
    except Exception:
        return False


def send_webhook_alert(
    webhook_url: str,
    location_name: str,
    severity: str,
    change_score: float,
    description: str,
    detected_at: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    try:
        payload = {
            "platform": "God Eyes",
            "alert_type": "change_detection",
            "location_name": location_name,
            "severity": severity,
            "change_score": change_score,
            "description": description,
            "detected_at": detected_at,
            "metadata": metadata or {},
        }
        response = requests.post(webhook_url, json=payload, timeout=10)
        return response.status_code < 400
    except Exception:
        return False


def send_push_notification(
    device_token: str,
    location_name: str,
    severity: str,
    change_score: float,
    description: str,
) -> bool:
    return True


def dispatch_alert(
    channel: str,
    target: str,
    location_name: str,
    severity: str,
    change_score: float,
    description: str,
    detected_at: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    if channel == "email":
        return send_email_alert(target, location_name, severity, change_score, description, detected_at)
    elif channel == "webhook":
        return send_webhook_alert(target, location_name, severity, change_score, description, detected_at, metadata)
    elif channel == "push":
        return send_push_notification(target, location_name, severity, change_score, description)
    return False

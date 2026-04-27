import os
try:
    import resend
except ImportError:
    resend = None

if resend:
    resend.api_key = os.environ.get("RESEND_API_KEY", "re_dummy_key")

def send_email(to_address: str, subject: str, html_content: str):
    if not os.environ.get("RESEND_API_KEY") or resend is None:
        print(f"Simulation email to {to_address}: {subject}")
        return True
        
    try:
        r = resend.Emails.send({
            "from": "ESN Toolbox <onboarding@resend.dev>",
            "to": [to_address],
            "subject": subject,
            "html": html_content
        })
        return r
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_email_batch(to_addresses: list[str], subject: str, html_content: str):
    recipients = [addr for addr in to_addresses if addr]
    if not recipients:
        recipients = ["rh@esn.com"]

    if not os.environ.get("RESEND_API_KEY") or resend is None:
        print(f"Simulation email to {', '.join(recipients)}: {subject}")
        return True

    try:
        r = resend.Emails.send({
            "from": "ESN Toolbox <onboarding@resend.dev>",
            "to": recipients,
            "subject": subject,
            "html": html_content
        })
        return r
    except Exception as e:
        print(f"Error sending email batch: {e}")
        return False

def send_daily_recap(recruteur: str, logs: dict):
    subject = f"Daily Recap - {recruteur}"
    html = f"<p>Nouveaux profils: {logs.get('nouveaux_profils')}</p><p>Entretiens: {logs.get('entretiens')}</p>"
    return send_email("rh@esn.com", subject, html)

def send_sprint_start(semaine: int):
    subject = f"Début du Sprint - Semaine {semaine}"
    html = f"<p>Le sprint de la semaine {semaine} a commencé.</p>"
    return send_email("rh@esn.com", subject, html)

def send_weekly_kpi(semaine: int, kpis: dict):
    subject = f"KPIs Hebdomadaires - Semaine {semaine}"
    html = f"<p>Besoins actifs: {kpis.get('besoins_actifs')}</p><p>Hirings: {kpis.get('hirings')}</p>"
    return send_email("rh@esn.com", subject, html)

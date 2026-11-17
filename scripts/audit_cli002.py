import subprocess

def run_query(sql):
    cmd = ["mysql", "-u", "root", "-e", sql]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()

print("=== ALL EMAIL LOGS ===")
print(run_query("SELECT id, client_id, email_type, recipient_email, subject, status, sent_at FROM db_digiink_master.email_logs;"))

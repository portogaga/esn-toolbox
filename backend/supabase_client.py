from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "http://dummy")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "dummy")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

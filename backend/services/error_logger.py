import traceback

def save_traceback(exc: Exception):
    with open("backend_error.log", "w") as f:
        f.write(traceback.format_exc())

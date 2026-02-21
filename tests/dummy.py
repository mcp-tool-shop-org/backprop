import time
import sys
import json

print(json.dumps({"step": 1, "loss": 0.5}))
sys.stdout.flush()

try:
    time.sleep(0.1)
    print(json.dumps({"step": 2, "loss": 0.4}))
    sys.stdout.flush()
except KeyboardInterrupt:
    print(json.dumps({"event": "checkpoint_saved", "path": "ckpt-final"}))
    sys.stdout.flush()
    sys.exit(0)

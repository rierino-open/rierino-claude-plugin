---
description: Quick health check and status overview of the Rierino platform.
---

# Rierino Status

The user wants a quick overview of the Rierino platform.

1. GET `${RIERINO_BASE_URL}/actuator/health` to check connectivity
2. GET `${RIERINO_BASE_URL}/api/request/rpc/Ping` to check if backend is running, it will return the parameter you send
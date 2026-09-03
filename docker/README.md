# Docker configuration

This folder contains the Docker and Compose configuration for the mock environment.

Structure:

- `docker/build/` — Dockerfile definitions
- `docker/compose/` — Compose profiles for accc, noauth, and panva
- `docker/env/` — environment files used by the compose profiles
- `docker/scripts/` — script entry points and helper logic

Examples:

```bash
chmod +x ../docker-control.sh ../docker/scripts/docker-control.sh
./docker-control.sh --profile accc --build-certs --build-images --up
./docker-control.sh --profile noauth --up
./docker-control.sh
```

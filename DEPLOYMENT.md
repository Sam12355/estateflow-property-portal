# Deployment

**Not deployed anywhere.** This is one module and a set of process documents.

## Container

The only deployable artefact, and it exists because the required-checks list includes a
container build and a repository that lists a check it cannot run should either run it or
say so.

```bash
docker build -t ai-engineering-playbook .
docker run --rm ai-engineering-playbook
```

**This has been executed.** The image builds and the module loads. Multi-stage, non-root,
tini as the init.

## Consuming the module

```bash
pnpm build      # dist/ with type declarations
```

No server, no database, no queue. The escalation decision is a pure function; a host
supplies the persistence and the sending.

## Verification status

| Item | State |
|------|-------|
| Build | Runs, clean |
| Tests | 24, executed, passing |
| Container build | **Executed**, image builds and runs |
| Published to a registry | Never |
| Deployed | Never |

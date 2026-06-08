# Security Policy

## Reporting a vulnerability

Do not report vulnerabilities or exposed credentials in a public issue.

Use GitHub's private vulnerability reporting feature for this repository when
it is available. If it is unavailable, contact the repository owner through
their GitHub profile without including secret values in the initial message.

Include:

* The affected route, component, or dependency
* Reproduction steps using non-production data
* The expected and observed behavior
* The potential impact

Do not access data that does not belong to you, disrupt the service, or publish
the report before the repository owner has had a reasonable opportunity to
investigate it.

## Secrets

If a credential is accidentally committed, revoke or rotate it immediately.
Removing it from the latest commit is not sufficient because it may remain in
Git history, forks, caches, or logs.

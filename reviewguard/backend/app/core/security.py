import hmac
import hashlib
from fastapi import HTTPException, Request


async def verify_github_webhook(request: Request, secret: str) -> None:
    if not secret:
        return
    signature = request.headers.get("X-Hub-Signature-256")
    if not signature:
        raise HTTPException(status_code=401, detail="Missing X-Hub-Signature-256")
    body = await request.body()
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid GitHub webhook signature")


async def verify_gitlab_webhook(request: Request, secret: str) -> None:
    if not secret:
        return
    token = request.headers.get("X-Gitlab-Token")
    if not token or token != secret:
        raise HTTPException(status_code=401, detail="Invalid GitLab webhook token")
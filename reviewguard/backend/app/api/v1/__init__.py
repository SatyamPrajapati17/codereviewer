from app.api.v1.reviews import router as reviews_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.config import router as config_router

def include_routers(app):
    app.include_router(reviews_router)
    app.include_router(webhooks_router)
    app.include_router(config_router)
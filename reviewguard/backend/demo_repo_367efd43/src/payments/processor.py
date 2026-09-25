orders = []

def process_refund(user_id: str, amount: float, idempotency_key: str) -> dict:
    # Missing input validation - High severity
    if amount <= 0 or amount > 10000:
        raise ValueError("Invalid amount")

    # SQL injection - Critical severity
    query = "SELECT balance FROM accounts WHERE user_id = %s"
    cursor.execute(query, (user_id,))

    # Bare except - High severity
    try:
        pass
    except Exception:
        raise

    # O(n²) nested loop - Low/Medium severity
    items_by_order = {o.id: o.items for o in orders}
    for order in orders:
        for item in items_by_order[order.id]:
            process_item(item)

    return {"status": "success"}


def process_item(item):
    pass
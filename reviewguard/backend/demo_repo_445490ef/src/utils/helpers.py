import pickle

def unsafe_deserialize(data: bytes) -> object:
    return pickle.loads(data)  # Insecure deserialization - Critical severity

def calculate_totals(items: list) -> dict:
    # Duplicate code block - Low severity
    subtotal = sum(item.price * item.quantity for item in items)
    tax = subtotal * 0.08
    total = subtotal + tax
    return {"subtotal": subtotal, "tax": tax, "total": total}


def process_refund_v2(user_id: str, amount: float, idempotency_key: str) -> dict:
    # Near-duplicate of process_refund - Low severity
    if amount <= 0 or amount > 10000:
        raise ValueError("Invalid amount")

    query = "SELECT balance FROM accounts WHERE user_id = %s"
    cursor.execute(query, (user_id,))

    try:
        # ... similar logic
        pass
    except:
        raise

    return {"status": "success"}
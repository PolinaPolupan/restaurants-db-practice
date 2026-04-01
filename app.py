import psycopg2
from fastapi import FastAPI, HTTPException, Depends, Query
from pymongo import MongoClient
from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_client = MongoClient(
    "mongodb://localhost:27017/",
    directConnection=True
)
mongo = mongo_client["restaurant_db"]

def get_pg_conn():
    return psycopg2.connect(
        dbname="restaurant",
        user="postgres",
        password="fY2cvIQXQma1WXV0XlBOFKrS6KvlR1vWkmUJeNCMTuSuUR16KHwebIAl74rnhtCU",
        host="localhost",
        port=6432
    )

class Employee(BaseModel):
    id: int = None
    name: str
    position: str
    branch_id: int

class ProductAdd(BaseModel):
    name: str
    price: float
    quantity: int
    manufacturer: str
    categoryId: str

class CartItem(BaseModel):
    product_id: str
    quantity: int

def get_user(email: str, password: str):
    conn = get_pg_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, password, role FROM users WHERE email = %s AND password = %s", (email, password))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        raise HTTPException(401, "Неверные email или пароль")
    return {
        "id": row[0], "name": row[1], "email": row[2], "password": row[3], "role": row[4]
    }

def check_role(user, roles):
    if user["role"] not in roles:
        raise HTTPException(403, "Нет доступа")


@app.get("/employees")
def list_employees():
    conn = get_pg_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, position, branch_id FROM employees")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {"id": r[0], "name": r[1], "position": r[2], "branch_id": r[3]}
        for r in rows
    ]

@app.post("/employees")
def add_employee(e: Employee):
    conn = get_pg_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO employees (name, position, branch_id) VALUES (%s, %s, %s) RETURNING id",
        (e.name, e.position, e.branch_id)
    )
    eid = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Employee added", "id": eid}

@app.delete("/employees/{eid}")
def delete_employee(eid: int):
    conn = get_pg_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM employees WHERE id = %s", (eid,))
    conn.commit()
    cur.close()
    conn.close()
    return {"msg": "Employee deleted"}

@app.get("/products")
def search_products(
    email: str = Query(...),
    password: str = Query(...),
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None
):
    query = {}
    if category:
        query["categoryId"] = ObjectId(category)
    if keyword:
        query["name"] = {"$regex": keyword, "$options": "i"}
    if price_min is not None or price_max is not None:
        query["price"] = {}
        if price_min is not None:
            query["price"]["$gte"] = price_min
        if price_max is not None:
            query["price"]["$lte"] = price_max
    prods = []
    for p in mongo.products.find(query):
        prods.append({
            "id": str(p["_id"]),
            "name": p["name"],
            "price": p["price"],
            "quantity": p["quantity"],
            "manufacturer": p["manufacturer"]
        })
    return prods

@app.post("/products")
def add_product(
    product: ProductAdd,
    email: str = Query(...),
    password: str = Query(...)
):
    user = get_user(email, password)
    check_role(user, ["admin", "manager"])
    p = product.dict()
    p["categoryId"] = ObjectId(p["categoryId"])
    mongo.products.insert_one(p)
    return {"msg": "Товар добавлен"}

@app.post("/cart/add")
def add_to_cart(
    item: CartItem,
    client_id: str,
    email: str = Query(...),
    password: str = Query(...)
):
    user = get_user(email, password)
    check_role(user, ["user", "manager", "admin"])

    client_doc = mongo.clients.find_one({"_id": ObjectId(client_id)})
    if not client_doc:
        raise HTTPException(404, "Клиент не найден (нет в MongoDB)")
    prod = mongo.products.find_one({"_id": ObjectId(item.product_id)})
    if not prod or prod["quantity"] < item.quantity:
        raise HTTPException(404, "Товар не найден или мало")
    mongo.clients.update_one(
        {"_id": client_doc["_id"]},
        {"$push": {"cart": {
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price": prod["price"],
            "name": prod["name"]
        }}}
    )
    return {"msg": f"{prod['name']} x {item.quantity} добавлено в корзину"}


@app.get("/cart/total")
def cart_total(
    client_id: str,
    email: str = Query(...),
    password: str = Query(...)
):
    client_doc = mongo.clients.find_one({"_id": ObjectId(client_id)})
    if not client_doc:
        raise HTTPException(404, "Клиент не найден (нет в MongoDB)")
    cart = client_doc.get("cart", [])
    total = sum(item["price"] * item["quantity"] for item in cart)
    return {
        "items": cart,
        "total": total
    }

@app.get("/clients")
def list_clients(email: str, password: str):
    user = get_user(email, password)
    check_role(user, ["user", "manager", "admin"])
    clients = []
    for c in mongo.clients.find():
        clients.append({
            "id": str(c["_id"]),
            "name": c.get("name", ""),
            "email": c.get("email", "")
        })
    return clients

@app.get("/categories")
def list_categories(email: str, password: str):
    user = get_user(email, password)
    check_role(user, ["admin", "manager"])
    cats = []
    for c in mongo.categories.find():
        cats.append({
            "id": str(c["_id"]),
            "name": c.get("name", "")
        })
    return cats

@app.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    email: str = Query(...),
    password: str = Query(...)):
    user = get_user(email, password)
    check_role(user, ["admin", "manager"])
    mongo.products.delete_one({"_id": ObjectId(product_id)})
    return {"msg": "Товар удален"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", port=8000, reload=True)
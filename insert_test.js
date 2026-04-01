db = db.getSiblingDB("restaurant_db");
let docs = [];
for (let i = 0; i < 20000; i++) {
    docs.push({
        name: "Test Product " + i,
        quantity: NumberInt(Math.floor(Math.random() * 100)),
        price: Double(Math.random() * 100 + 0.01),
        manufacturer: "Test Factory",
        categoryId: new ObjectId()
    });

    if (docs.length === 1000) {
        db.products.insertMany(docs);
        docs = [];
    }
}
if (docs.length > 0) {
    db.products.insertMany(docs);
}
print("Successfully inserted 20,000 products!");

db.categories.find()

const catId = db.categories.findOne({ name: "Salads" })._id;
db.products.find({ categoryId: catId });

db.products.find({ name: /Caesar Salad/i });

const product = db.products.findOne({ name: "Greek Salad" });
db.clients.updateOne(
    { email: "sergey@example.com" },
    { $push: { cart: { productId: product._id, quantity: 1, addedAt: new Date() } } }
);

const client = db.clients.findOne({ email: "sergey@example.com" });
db.orders.find({ clientId: client._id });

db.orders.updateOne(
    { _id: "69c9264ca9d9e454e19d81de" },
    { $set: { status: "completed" } }
);

const fromDate = new Date("2026-02-01");
db.orders.aggregate([
    { $match: { date: { $gte: fromDate }, status: "completed" } },
    { $unwind: "$items" },
    { $group: {
            _id: "$items.productId",
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }},
    { $sort: { totalSold: -1, totalRevenue: -1 } },
    { $limit: 10 },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $project: {
            "product.name": 1,
            totalSold: 1,
            totalRevenue: 1
        }}
])

const fromDate = new Date("2026-02-01");
const N = 0;
db.orders.aggregate([
    { $match: { date: { $gte: fromDate }, status: "completed" } },
    { $group: { _id: "$clientId", orderCount: { $sum: 1 } } },
    { $match: { orderCount: { $gt: N } } },
    { $lookup: { from: "clients", localField: "_id", foreignField: "_id", as: "client" } },
    { $unwind: "$client" },
    { $project: { "client.name": 1, orderCount: 1 } }
])

const fromDate = new Date("2026-03-01");
const toDate = new Date("2026-03-29");
db.orders.aggregate([
    { $match: { date: { $gte: fromDate, $lte: toDate }, status: "completed" } },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $group: { _id: "$product.categoryId", totalSold: { $sum: "$items.quantity" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    { $project: { "category.name": 1, totalSold: 1 } },
    { $sort: { totalSold: -1 } }
])

const dateToCheck = new Date("2026-03-01");

db.products.aggregate([
    {
        $lookup: {
            from: "orders",
            let: { productId: "$_id" },
            pipeline: [
                { $match: { date: dateToCheck, status: "completed" } },
                { $unwind: "$items" },
                { $match: { $expr: { $eq: ["$items.productId", "$$productId"] } } }
            ],
            as: "orders_on_date"
        }
    },
    { $match: { orders_on_date: { $size: 0 } } }
])
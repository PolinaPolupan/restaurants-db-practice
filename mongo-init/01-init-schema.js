db = db.getSiblingDB("restaurant_db");

db.categories.drop();
db.products.drop();
db.employees.drop();
db.clients.drop();
db.orders.drop();

db.createCollection('categories', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name"],
            properties: {
                name: { bsonType: "string", description: "Category name, required" }
            }
        }
    }
});
db.categories.insertMany([
    { name: 'Salads' },
    { name: 'Main Dishes' },
    { name: 'Drinks' },
    { name: 'Desserts' }
]);

db.createCollection('products', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "quantity", "price", "manufacturer", "categoryId"],
            properties: {
                name: { bsonType: "string", description: "Product name" },
                quantity: { bsonType: "int", minimum: 0, description: "Stock quantity" },
                price: { bsonType: "double", minimum: 0, description: "Product price" },
                manufacturer: { bsonType: "string", description: "Product manufacturer/brand" },
                categoryId: { bsonType: "objectId", description: "Reference to category" }
            }
        }
    }
});

const saladCategoryId = db.categories.findOne({name: 'Salads'})._id;
const mainDishCategoryId = db.categories.findOne({name: 'Main Dishes'})._id;
const drinksCategoryId = db.categories.findOne({name: 'Drinks'})._id;
const dessertsCategoryId = db.categories.findOne({name: 'Desserts'})._id;

db.products.insertMany([
    { name: "Caesar Salad", quantity: 50, price: 7.99, manufacturer: "Chef Anna", categoryId: saladCategoryId },
    { name: "Greek Salad", quantity: 30, price: 6.49, manufacturer: "Chef Anna", categoryId: saladCategoryId },
    { name: "Chicken Alfredo", quantity: 40, price: 14.99, manufacturer: "Chef Ben", categoryId: mainDishCategoryId },
    { name: "Beef Burger", quantity: 25, price: 12.99, manufacturer: "Chef Mike", categoryId: mainDishCategoryId },
    { name: "Lemonade", quantity: 100, price: 2.99, manufacturer: "Drinks Co.", categoryId: drinksCategoryId },
    { name: "Chocolate Cake", quantity: 15, price: 5.49, manufacturer: "Bakery House", categoryId: dessertsCategoryId }
]);

// db.createCollection('employees', {
//     validator: {
//         $jsonSchema: {
//             bsonType: "object",
//             required: ["name", "role"],
//             properties: {
//                 name: { bsonType: "string", description: "Employee name" },
//                 role: { bsonType: "string", description: "Job role" }
//             }
//         }
//     }
// });
// db.employees.insertMany([
//     { name: "Anna Ivanova", role: "Chef" },
//     { name: "Ben Petrov", role: "Chef" },
//     { name: "Olga Sidorova", role: "Waiter" }
// ]);

db.createCollection('clients', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "cart"],
            properties: {
                name: { bsonType: "string", description: "Client name" },
                email: { bsonType: "string", pattern: "^.+@.+\\..+$", description: "Client email" },
                phone: { bsonType: "string", description: "Phone number (optional)" },
                cart: { bsonType: "array", items: { bsonType: "object" }, description: "Products in cart" }
            }
        }
    }
});
db.clients.insertMany([
    { name: "Sergey Semenov", email: "sergey@example.com", phone: "74951231212", cart: [] },
    { name: "Irina Petrova", email: "irina@example.com", phone: "74959882345", cart: [] }
]);

db.createCollection('orders', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["clientId", "status", "date", "items"],
            properties: {
                clientId: { bsonType: "objectId", description: "Reference to client" },
                status: { enum: ["pending", "completed", "cancelled"], description: "Order status" },
                date: { bsonType: "date", description: "Order date" },
                items: {
                    bsonType: "array",
                    minItems: 1,
                    items: {
                        bsonType: "object",
                        required: ["productId", "quantity", "price"],
                        properties: {
                            productId: { bsonType: "objectId" },
                            quantity: { bsonType: "int", minimum: 1 },
                            price: { bsonType: "double", minimum: 0 }
                        }
                    }
                }
            }
        }
    }
});

const client1 = db.clients.findOne({name: "Sergey Semenov"});
const client2 = db.clients.findOne({name: "Irina Petrova"});
const product1 = db.products.findOne({name: "Caesar Salad"});
const product2 = db.products.findOne({name: "Lemonade"});
const product3 = db.products.findOne({name: "Chocolate Cake"});

db.orders.insertMany([
    {
        clientId: client1._id,
        status: "completed",
        date: new Date("2026-03-01"),
        items: [
            { productId: product1._id, quantity: 2, price: product1.price },
            { productId: product2._id, quantity: 1, price: product2.price }
        ]
    },
    {
        clientId: client2._id,
        status: "pending",
        date: new Date("2026-03-29"),
        items: [
            { productId: product3._id, quantity: 3, price: product3.price }
        ]
    }
]);

// db.createCollection('users', {
//     validator: {
//         $jsonSchema: {
//             bsonType: "object",
//             required: ["name", "email", "password", "role"],
//             properties: {
//                 name: { bsonType: "string" },
//                 email: { bsonType: "string" },
//                 password: { bsonType: "string" },
//                 role: { enum: ["admin", "manager", "user", "guest"] }
//             }
//         }
//     }
// });
//
// db.users.insertMany([
//     {
//         name: "Администратор",
//         email: "admin@example.com",
//         password: "admin",
//         role: "admin"
//     },
//     {
//         name: "Менеджер",
//         email: "manager@example.com",
//         password: "manager",
//         role: "manager"
//     },
//     {
//         name: "Пользователь",
//         email: "user@example.com",
//         password: "user",
//         role: "user"
//     },
//     {
//         name: "Гость",
//         email: "guest@example.com",
//         password: "",
//         role: "guest"
//     }
// ]);
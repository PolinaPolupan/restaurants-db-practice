db = db.getSiblingDB("restaurant_db");

db.createRole({
  role: "adminRole",
  privileges: [
    { resource: { db: "restaurant_db", collection: "" }, actions: [ "find", "insert", "update", "remove", "createCollection", "dropCollection" ] }
  ],
  roles: []
});

db.createUser({
  user: "admin",
  pwd: "admin",
  roles: [ { role: "adminRole", db: "restaurant_db" } ]
});


db.createRole({
  role: "managerRole",
  privileges: [
    { resource: { db: "restaurant_db", collection: "products" }, actions: [ "find", "insert", "update", "remove" ] },
    { resource: { db: "restaurant_db", collection: "categories" }, actions: [ "find" ] },
    { resource: { db: "restaurant_db", collection: "orders" }, actions: [ "find" ] }
  ],
  roles: []
});

db.createUser({
  user: "manager",
  pwd: "manager",
  roles: [ { role: "managerRole", db: "restaurant_db" } ]
});


db.createRole({
  role: "userRole",
  privileges: [
    { resource: { db: "restaurant_db", collection: "products" }, actions: [ "find" ] },
    { resource: { db: "restaurant_db", collection: "categories" }, actions: [ "find" ] },
    { resource: { db: "restaurant_db", collection: "orders" }, actions: [ "find", "insert" ] }
  ],
  roles: []
});

db.createUser({
  user: "user",
  pwd: "user",
  roles: [ { role: "userRole", db: "restaurant_db" } ]
});


db.createRole({
  role: "guestRole",
  privileges: [
    { resource: { db: "restaurant_db", collection: "" }, actions: [ "find" ] }
  ],
  roles: []
});

db.createUser({
  user: "guest",
  pwd: "guest",
  roles: [ { role: "guestRole", db: "restaurant_db" } ]
});
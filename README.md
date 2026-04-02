Here is the complete, step-by-step guide to deploying your sharded MongoDB cluster on Kubernetes from scratch. 
### Step 1: Aply the manifests
---

### Step 2: Initialize the Config Server
The `mongos` router cannot start properly until the config server replica set is initialized. Run this command to initialize `configrs`:

```bash
kubectl exec -it mongo-configsvr-0 -- mongosh --port 27019 --eval 'rs.initiate({_id: "configrs", configsvr: true, members: [{ _id: 0, host: "mongo-configsvr-0.mongo-configsvr.default.svc.cluster.local:27019" }]})'
```
*(You should see `{ ok: 1 }`)*. 

Wait about 10 seconds for the `mongo-router` pod to automatically connect and finish its startup sequence.

---

### Step 3: Initialize the Shard Servers
Next, initialize the individual replica sets for both of your shards so they can accept data.

**Initialize Shard 0:**
```bash
kubectl exec -it mongo-shard0-0 -- mongosh --port 27018 --eval 'rs.initiate({_id: "shard0", members: [{ _id: 0, host: "mongo-shard0-0.mongo-shard0.default.svc.cluster.local:27018" }]})'
```

**Initialize Shard 1:**
```bash
kubectl exec -it mongo-shard1-0 -- mongosh --port 27018 --eval 'rs.initiate({_id: "shard1", members: [{ _id: 0, host: "mongo-shard1-0.mongo-shard1.default.svc.cluster.local:27018" }]})'
```

Wait about 10 seconds for the shards to elect themselves as PRIMARY.

---

### Step 4: Add the Shards to the Router
Now you must tell the `mongos` router that these shards exist so it can distribute databases and collections across them.

**Add Shard 0 to the Router:**
```bash
kubectl exec -it deploy/mongo-router -- mongosh --port 27017 --eval 'sh.addShard("shard0/mongo-shard0-0.mongo-shard0.default.svc.cluster.local:27018")'
```

**Add Shard 1 to the Router:**
```bash
kubectl exec -it deploy/mongo-router -- mongosh --port 27017 --eval 'sh.addShard("shard1/mongo-shard1-0.mongo-shard1.default.svc.cluster.local:27018")'
```

---

### Step 5: Connect and Test
Your sharded cluster is now fully functional! 

To access it from your local machine, set up port-forwarding:
```bash
kubectl port-forward svc/mongo-router 27017:27017
```

Leave that running, open a new terminal (or use MongoDB Compass), and connect to the cluster:
```bash
mongosh mongodb://localhost:27017
```

Once connected, you can create your database and enable sharding for it:
```javascript
// Switch to your database
use restaurant_db

// Enable sharding for the database
sh.enableSharding("restaurant_db")

// (Optional) Shard a specific collection based on a shard key
// sh.shardCollection("restaurant_db.restaurants", { "restaurant_id": 1 })
```

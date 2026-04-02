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

Here is the complete, step-by-step guide to installing the Zalando Postgres Operator on Docker Desktop (Kubernetes), deploying a PostgreSQL database, and connecting to it.

### Prerequisites
Make sure you have **Kubernetes enabled** in Docker Desktop and that you have `helm` and `kubectl` installed on your machine.

---

### Step 1: Install the Zalando Postgres Operator
The easiest way to install the operator is using Helm.

1. Add the Zalando Helm repository:
   ```bash
   helm repo add postgres-operator-charts https://opensource.zalando.com/postgres-operator/charts/postgres-operator
   helm repo update
   ```

2. Install the operator:
   ```bash
   helm install postgres-operator postgres-operator-charts/postgres-operator
   ```

3. Verify the operator is running:
   ```bash
   kubectl get pods -l app.kubernetes.io/name=postgres-operator
   ```
   *(Wait until the pod is in the `Running` state).*

---

### Step 2: Deploy a PostgreSQL Cluster
Once the operator is running, you can create a PostgreSQL cluster by applying a Custom Resource Definition (CRD) called `postgresql`.

1. Create a file named `postgres-cluster.yaml` with the following basic configuration:

   ```yaml name=postgres-cluster.yaml
   apiVersion: "acid.zalan.do/v1"
   kind: postgresql
   metadata:
     name: my-postgres-cluster
     namespace: default
   spec:
     teamId: "dev"
     volume:
       size: 1Gi
     numberOfInstances: 2
     users:
       # username: privileges
       dbuser:  
       - superuser
       - createdb
     databases:
       # dbname: owner
       dev_db: dbuser
     postgresql:
       version: "15"
   ```

2. Apply the configuration to your cluster:
   ```bash
   kubectl apply -f postgres-cluster.yaml
   ```

3. Wait for the database pods to spin up:
   ```bash
   kubectl get pods -l application=spilo -w
   ```
   *(You should see `my-postgres-cluster-0` and `my-postgres-cluster-1` transition to `Running`. Press `Ctrl+C` to exit the watch).*

---

### Step 3: Retrieve the Database Credentials
The Zalando operator automatically generates strong passwords for the users you define and stores them in Kubernetes Secrets.

The secret name format is `<username>.<cluster-name>.credentials.postgresql.acid.zalan.do`.

Run this command to decode and view the password for `dbuser`:
```bash
kubectl get secret dbuser.my-postgres-cluster.credentials.postgresql.acid.zalan.do -o jsonpath="{.data.password}" | base64 --decode ; echo
```
*(Copy the output password, you'll need it to connect).*

---

### Step 4: Connect to the Database
To connect to the database from your local machine, you need to port-forward the master service. The operator automatically creates a service for the primary node named `<cluster-name>`.

1. Start port-forwarding:
   ```bash
   kubectl port-forward svc/my-postgres-cluster 5432:5432
   ```

2. Leave that running, open a **new terminal**, and connect using `psql`, pgAdmin, DBeaver, or DataGrip. 

   If you have `psql` installed locally, you can connect like this:
   ```bash
   psql -h localhost -p 5432 -U dbuser -d dev_db
   ```
   *(Paste the password you retrieved in Step 3 when prompted).*

You are now connected to a highly available PostgreSQL cluster managed by the Zalando Operator!

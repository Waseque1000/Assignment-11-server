const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server ok");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esfshrg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    // !
    const database = client.db("assignment-11").collection("all-data");
    const liked = client.db("assignment-11").collection("liked");

    // get
    app.get("/all-data", async (req, res) => {
      const data = await database.find().toArray();
      res.json(data);
    });
    app.post("/all-data", async (req, res) => {
      try {
        const newArtifact = req.body;
        console.log("Received artifact:", newArtifact); // Log incoming data
        const result = await database.insertOne(newArtifact);
        res.status(201).json({
          message: "Artifact added successfully",
          artifact: { id: result.insertedId },
        });
      } catch (error) {
        console.error("Error adding artifact:", error);
        res.status(500).json({ error: "Failed to add artifact" });
      }
    });
    // ?

    app.get("/artifact/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await database.findOne(query);
      res.send(result);
    });
    //
    app.post("/liked", async (req, res) => {
      try {
        const likedArtifact = req.body; // Data from the client (artifact to be added to favorites)
        console.log("Received liked artifact:", likedArtifact);

        // Insert the artifact into the 'liked' collection
        const result = await liked.insertOne(likedArtifact);

        res.status(201).json({
          message: "Artifact added to favorites successfully",
          artifact: { id: result.insertedId },
        });
      } catch (error) {
        console.error("Error adding to favorites:", error);
        res.status(500).json({ error: "Failed to add artifact to favorites" });
      }
    });

    app.get("/liked", async (req, res) => {
      const result = await liked.find().toArray();
      res.send(result);
    });
    //
    app.delete("/liked/:id", async (req, res) => {
      const { id } = req.params;
      console.log("Received DELETE request for id:", id); // Log the id

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid artifact id" });
      }

      try {
        const result = await liked.deleteOne({ _id: new ObjectId(id) });
        console.log("Delete result:", result);

        if (result.deletedCount === 1) {
          res.status(200).send({ message: "Artifact deleted successfully" });
        } else {
          res.status(404).send({ error: "Artifact not found" });
        }
      } catch (error) {
        console.error("Error deleting artifact:", error);
        res.status(500).send({ error: "Failed to delete artifact" });
      }
    });

    // DELETE artifact from all-data
    app.delete("/all-data/:id", async (req, res) => {
      const { id } = req.params;
      console.log("Received DELETE request for artifact id:", id);

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid artifact id" });
      }

      try {
        const result = await database.deleteOne({ _id: new ObjectId(id) });
        console.log("Delete result:", result);

        if (result.deletedCount === 1) {
          res.status(200).json({ message: "Artifact deleted successfully" });
        } else {
          res.status(404).json({ error: "Artifact not found" });
        }
      } catch (error) {
        console.error("Error deleting artifact:", error);
        res.status(500).json({ error: "Failed to delete artifact" });
      }
    });

    // Update artifact in all-data
    app.put("/all-data/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      console.log("Received update request for id:", id);
      console.log("Update data:", updatedData);

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid artifact id" });
      }

      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: updatedData };

        const result = await database.updateOne(filter, updateDoc);

        if (result.matchedCount === 1) {
          res.status(200).json({ message: "Artifact updated successfully" });
        } else {
          res.status(404).json({ error: "Artifact not found" });
        }
      } catch (error) {
        console.error("Error updating artifact:", error);
        res.status(500).json({ error: "Failed to update artifact" });
      }
    });

    //TODO:
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});

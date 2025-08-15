const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
// app.use(cors(corsOptions))
app.use(
  cors({
    origin: ["http://localhost:5173", "https://styleman.vercel.app"],
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ukfmznj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const dailyIncomeCollection = client
      .db("StyleMan")
      .collection("dailyIncome");
    const dailyExpenseCollection = client
      .db("StyleMan")
      .collection("dailyExpense");
    const categoryCollection = client.db("StyleMan").collection("category");
    const unPaidIncomeCollection = client
      .db("StyleMan")
      .collection("unPaidIncome");

    //monthly income page api
    app.get("/dailyIncome", async (req, res) => {
      try {
        const { filterBy, month, year } = req.query;

        let dailyIncomes = await dailyIncomeCollection
          .find()
          .sort({ _id: -1 })
          .toArray();

        // Date parsing helper
        const parseDate = (dateStr) => new Date(dateStr);

        let filtered = dailyIncomes;

        if (filterBy === "today") {
          const today = new Date();
          filtered = dailyIncomes.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getDate() === today.getDate() &&
              dateObj.getMonth() === today.getMonth() &&
              dateObj.getFullYear() === today.getFullYear()
            );
          });
        } else if (filterBy === "month" && month && year) {
          filtered = dailyIncomes.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getMonth() + 1 === parseInt(month, 10) &&
              dateObj.getFullYear() === parseInt(year, 10)
            );
          });
        } else if (filterBy === "year" && year) {
          filtered = dailyIncomes.filter((item) => {
            const dateObj = parseDate(item.date);
            return dateObj.getFullYear() === parseInt(year, 10);
          });
        }

        res.status(200).send(filtered);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/todayIncome", async (req, res) => {
      try {
        const incomes = await dailyIncomeCollection.find().toArray();

        const today = new Date();

        // আজকের তারিখ ফিল্টার
        const todayIncomes = incomes.filter((item) => {
          const dateObj = new Date(item.date);
          return (
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear()
          );
        });

        // মোট আয় বের করা
        const totalIncome = todayIncomes.reduce((sum, item) => {
          const price = Number(item.offerPrice) || Number(item.price) || 0;
          return sum + price;
        }, 0);

        res.send({ totalIncome });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/dailyIncome", async (req, res) => {
      const dailyIncome = req.body;
      const result = await dailyIncomeCollection.insertOne(dailyIncome);
      res.send(result);
    });

    // post category
    app.post("/category", async (req, res) => {
      const data = req.body;
      const result = await categoryCollection.insertOne(data);
      res.send(result);
    });

    app.put("/expense-data-update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedDoc = {
        $set: {
          title: req.body.title,
          price: req.body.price,
          salesmanName: req.body.salesmanName,
        },
      };
      const result = await dailyExpenseCollection.updateOne(
        { _id: new ObjectId(id) },
        updatedDoc
      );
      res.send(result);
    });
    app.put("/income-data-update/:id", async (req, res) => {
      const id = req.params.id;
      const updatedDoc = {
        $set: {
          title: req.body.title,
          category: req.body.category,
          price: req.body.price,
          offerPrice: req.body.offerPrice,
          customerName: req.body.customerName,
          phoneNumber: req.body.phoneNumber,
          salesmanName: req.body.salesmanName,
        },
      };
      const result = await dailyIncomeCollection.updateOne(
        { _id: new ObjectId(id) },
        updatedDoc
      );
      res.send(result);
    });

    app.get("/income-data/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await dailyIncomeCollection.findOne(query);
      res.send(result);
    });

    // expense data get from expense update
    app.get("/expense-data/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await dailyExpenseCollection.findOne(query);
      res.send(result);
    });

    // update category IN updatedIncome page
    app.put("/update-category/:id", async (req, res) => {
      const id = req.params.id;
      const updatedDoc = {
        $set: {
          categoryName: req.body.category,
          price: req.body.price,
        },
      };
      const result = await categoryCollection.updateOne(
        { categoryId: id },
        updatedDoc
      );
      res.send(result);
    });

    app.delete("/dailyIncome/:id", async (req, res) => {
      try {
        const getId = req.params.id;
        const id = {
          _id: new ObjectId(getId),
        };
        const result = await dailyIncomeCollection.deleteOne(id);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error deleting document", error });
      }
    });

    // Monthly  Expense api
    app.get("/dailyExpense", async (req, res) => {
      try {
        const { filterBy, month, year } = req.query;

        let dailyExpense = await dailyExpenseCollection
          .find()
          .sort({ _id: -1 })
          .toArray();

        // Date parsing helper
        const parseDate = (dateStr) => new Date(dateStr);

        let filtered = dailyExpense;

        if (filterBy === "today") {
          const today = new Date();
          filtered = dailyExpense.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getDate() === today.getDate() &&
              dateObj.getMonth() === today.getMonth() &&
              dateObj.getFullYear() === today.getFullYear()
            );
          });
        } else if (filterBy === "month" && month && year) {
          filtered = dailyExpense.filter((item) => {
            const dateObj = parseDate(item.date);
            return (
              dateObj.getMonth() + 1 === parseInt(month, 10) &&
              dateObj.getFullYear() === parseInt(year, 10)
            );
          });
        } else if (filterBy === "year" && year) {
          filtered = dailyExpense.filter((item) => {
            const dateObj = parseDate(item.date);
            return dateObj.getFullYear() === parseInt(year, 10);
          });
        }

        res.status(200).send(filtered);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/todayExpense", async (req, res) => {
      try {
        const expenses = await dailyExpenseCollection.find().toArray();

        const today = new Date();

        // আজকের তারিখ ফিল্টার
        const todayExpense = expenses.filter((item) => {
          const dateObj = new Date(item.date);
          return (
            dateObj.getDate() === today.getDate() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getFullYear() === today.getFullYear()
          );
        });

        // মোট আয় বের করা
        const totalExpenses = todayExpense.reduce((sum, item) => {
          const price = Number(item.offerPrice) || Number(item.price) || 0;
          return sum + price;
        }, 0);

        res.send({ totalExpenses });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.post("/dailyExpense", async (req, res) => {
      try {
        const dailyExpense = req.body;
        const result = await dailyExpenseCollection.insertOne(dailyExpense);
        res.send(result);
      } catch (error) {
        console.error("Error inserting daily expense:", error);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.delete("/dailyExpense/:id", async (req, res) => {
      try {
        const getId = req.params.id;
        const id = {
          _id: new ObjectId(getId),
        };
        const result = await dailyExpenseCollection.deleteOne(id);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Error deleting document", error });
      }
    });

    //   dashboard chart income/expense api
    app.get("/monthlyIncome", async (req, res) => {
      try {
        const getIncome = await dailyIncomeCollection.find().toArray();

        const monthlyIncomeMap = {};

        const currentYear = new Date().getFullYear(); // আজকের বছর (যেমন 2025)

        getIncome.forEach((item) => {
          const dateStr = item.date;
          const parts = dateStr.split(", ");
          if (parts.length < 3) return;

          const monthDay = parts[1];
          const yearStr = parts[2];

          const fullDateStr = monthDay + " " + yearStr;
          const dateObj = new Date(fullDateStr);
          if (isNaN(dateObj)) return;

          // শুধু বর্তমান বছর (currentYear) এর data গুলো বিবেচনা করবো
          if (dateObj.getFullYear() !== currentYear) return;

          const monthKey = `${dateObj.getFullYear()}-${String(
            dateObj.getMonth() + 1
          ).padStart(2, "0")}`;

          const incomeValue = item.offerPrice
            ? Number(item.offerPrice)
            : Number(item.price);

          if (!monthlyIncomeMap[monthKey]) {
            monthlyIncomeMap[monthKey] = 0;
          }
          monthlyIncomeMap[monthKey] += incomeValue;
        });

        res.json({ success: true, monthlyIncome: monthlyIncomeMap });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    app.get("/monthlyExpense", async (req, res) => {
      try {
        const getExpense = await dailyExpenseCollection.find().toArray();

        const monthlyExpenseMap = {};

        const currentYear = new Date().getFullYear(); // আজকের বছর (যেমন 2025)

        getExpense.forEach((item) => {
          const dateStr = item.date;
          const parts = dateStr.split(", ");
          if (parts.length < 3) return;

          const monthDay = parts[1];
          const yearStr = parts[2];

          const fullDateStr = monthDay + " " + yearStr;
          const dateObj = new Date(fullDateStr);
          if (isNaN(dateObj)) return;

          // শুধু বর্তমান বছর (currentYear) এর data গুলো বিবেচনা করবো
          if (dateObj.getFullYear() !== currentYear) return;

          const monthKey = `${dateObj.getFullYear()}-${String(
            dateObj.getMonth() + 1
          ).padStart(2, "0")}`;

          const expenseValue = item.offerPrice
            ? Number(item.offerPrice)
            : Number(item.price);

          if (!monthlyExpenseMap[monthKey]) {
            monthlyExpenseMap[monthKey] = 0;
          }
          monthlyExpenseMap[monthKey] += expenseValue;
        });

        res.json({ success: true, mothlyExpense: monthlyExpenseMap });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      }
    });

    // dashboard recent data api
    app.get("/recentIncomeData", async (req, res) => {
      try {
        const getData = await dailyIncomeCollection
          .find()
          .sort({ _id: -1 })
          .limit(3)
          .toArray();

        res.send(getData);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/recentExpenseData", async (req, res) => {
      try {
        const getData = await dailyExpenseCollection
          .find()
          .sort({ _id: -1 })
          .limit(3)
          .toArray();

        res.send(getData);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Server error" });
      }
    });

    app.get("/category", async (req, res) => {
      const now = new Date();
      const currentMonth = now.toLocaleString("en-US", { month: "long" }); // "August"
      const currentYear = now.getFullYear(); // 2025

      // MongoDB থেকে ডেটা ফিল্টার
      const categories = await categoryCollection
        .find({
          date: { $regex: `${currentMonth}`, $options: "i" }, // "August" match করবে
        })
        .toArray();

      // যদি year match করাও লাগে:
      const filtered = categories.filter((item) => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getMonth() === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );
      });

      res.send(filtered);
    });

    // বকেয়া ইনকাম
    app.get("/unPaidIncome", async (req, res) => {
      const result = await unPaidIncomeCollection.find().toArray();
      res.send(result);
    });

    app.post("/unPaidIncome", async (req, res) => {
      const unPaidData = req.body;
      const result = await unPaidIncomeCollection.insertOne(unPaidData);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("StyleMan Server is Working");
});

app.listen(port, () => {
  console.log(`this server is runnig on port ${port}`);
});

import express from "express";
const app = express();
const PORT = 3000;

app.use(express.json());
app.get("/", (req, res) => {
    res.json({
        name: "Trust Issues" ,
        message: "Security lab API is running"
    });
});

app.get("/health", (req, res) => {
    res.json({ status: "healthy" });
});

app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});
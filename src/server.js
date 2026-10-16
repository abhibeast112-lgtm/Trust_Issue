import express from "express";
import "dotenv/config";
import session from "express-session";
import authRoutes from "./routes/auth.js";
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing. Set it in your .env file.");
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");

app.use(express.json({ limit: "10kb" }));

app.use(
  session({
    name: "trust.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 30
    }
  })
);
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

app.use("/api/auth", authRoutes);

app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
});
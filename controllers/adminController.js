import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Keep in case you switch to hashed passwords later

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return res.status(500).json({ success: false, message: "Server configuration error" });
    }

    if (email === process.env.SELLER_EMAIL && password === process.env.SELLER_PASSWORD) {
      const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      console.log("Admin login - Generated Token:", token); // Debug
      return res.json({ success: true, token });
    } else {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adminMe = async (req, res) => {
  try {
    const { email } = req.user;

    if (email !== process.env.SELLER_EMAIL) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    return res.json({
      success: true,
      admin: { email, name: "Admin", role: "admin" },
    });
  } catch (error) {
    console.error("Admin me error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
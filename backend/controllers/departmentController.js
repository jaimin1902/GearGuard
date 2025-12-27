import pool from "../db/connection.js";

// Get all departments
export const getAllDepartments = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM departments ORDER BY name"
    );
    // console.log("🚀 ~ getAllDepartments ~ result:", result.rows)
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Create department
export const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    
    const result = await pool.query(
      `INSERT INTO departments (name)
      VALUES ($1)
      RETURNING *`,
      [name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};


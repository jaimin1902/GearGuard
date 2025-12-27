import pool from "../db/connection.js";
import bcrypt from "bcryptjs";

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, department_id } = req.query;
    
    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.avatar_url,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (role) {
      query += ` AND u.role = $${paramCount++}`;
      params.push(role);
    }
    
    if (department_id) {
      query += ` AND u.department_id = $${paramCount++}`;
      params.push(department_id);
    }
    
    query += ` ORDER BY u.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get technicians (for team assignment)
export const getTechnicians = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.avatar_url, u.role,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role IN ('technician', 'manager', 'admin')
      ORDER BY u.name`
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};


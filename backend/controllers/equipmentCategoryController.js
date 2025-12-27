import pool from "../db/connection.js";

// Get all equipment categories
export const getAllCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        ec.*,
        u.name as responsible_name,
        u.email as responsible_email
      FROM equipment_categories ec
      LEFT JOIN users u ON ec.responsible_user_id = u.id
      ORDER BY ec.name ASC`
    );
    console.log("🚀 ~ getAllCategories ~ result:", result.rows)
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get single category by ID
export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT 
        ec.*,
        u.name as responsible_name,
        u.email as responsible_email
      FROM equipment_categories ec
      LEFT JOIN users u ON ec.responsible_user_id = u.id
      WHERE ec.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new category
export const createCategory = async (req, res, next) => {
  try {
    const { name, responsible_user_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    const result = await pool.query(
      `INSERT INTO equipment_categories (name, responsible_user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name, responsible_user_id || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: "Category name already exists" });
    }
    next(error);
  }
};

// Update category
export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, responsible_user_id } = req.body;
    
    const result = await pool.query(
      `UPDATE equipment_categories SET
        name = COALESCE($1, name),
        responsible_user_id = COALESCE($2, responsible_user_id)
      WHERE id = $3
      RETURNING *`,
      [name, responsible_user_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: "Category name already exists" });
    }
    next(error);
  }
};

// Delete category
export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if category is used by any equipment
    const checkResult = await pool.query(
      `SELECT COUNT(*) as count FROM equipment WHERE equipment_category_id = $1`,
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category. It is being used by equipment." 
      });
    }
    
    const result = await pool.query(
      `DELETE FROM equipment_categories WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    next(error);
  }
};


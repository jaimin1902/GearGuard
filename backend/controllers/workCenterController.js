import pool from "../db/connection.js";

// Get all work centers
export const getAllWorkCenters = async (req, res, next) => {
  try {
    const { search, department_id, team_id } = req.query;
    let query = `
      SELECT 
        wc.*,
        d.name as department_name,
        mt.name as maintenance_team_name
      FROM work_centers wc
      LEFT JOIN departments d ON wc.department_id = d.id
      LEFT JOIN maintenance_teams mt ON wc.maintenance_team_id = mt.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (wc.name ILIKE $${paramCount} OR wc.code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    if (department_id && department_id !== "undefined" && department_id !== "null") {
      const deptId = parseInt(department_id);
      if (!isNaN(deptId)) {
        query += ` AND wc.department_id = $${paramCount++}`;
        params.push(deptId);
      }
    }
    
    if (team_id && team_id !== "undefined" && team_id !== "null") {
      const teamId = parseInt(team_id);
      if (!isNaN(teamId)) {
        query += ` AND wc.maintenance_team_id = $${paramCount++}`;
        params.push(teamId);
      }
    }
    
    query += ` ORDER BY wc.name`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get work center by ID
export const getWorkCenterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        wc.*,
        d.name as department_name,
        mt.name as maintenance_team_name
      FROM work_centers wc
      LEFT JOIN departments d ON wc.department_id = d.id
      LEFT JOIN maintenance_teams mt ON wc.maintenance_team_id = mt.id
      WHERE wc.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Work center not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create work center
export const createWorkCenter = async (req, res, next) => {
  try {
    const {
      name,
      code,
      tag,
      location,
      department_id,
      maintenance_team_id,
      description,
      alternative_workcenters,
      cost_per_hour,
      capacity_time_efficiency,
      oee_target,
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!maintenance_team_id) {
      return res.status(400).json({ error: "Maintenance team is required" });
    }
    
    // Ensure maintenance_team_id is a valid integer
    const teamId = parseInt(maintenance_team_id);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: "Valid maintenance team is required" });
    }
    
    const result = await pool.query(
      `INSERT INTO work_centers (
        name, code, tag, location, department_id, maintenance_team_id, description,
        alternative_workcenters, cost_per_hour, capacity_time_efficiency, oee_target
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        name,
        code || null,
        tag || null,
        location || null,
        department_id && !isNaN(parseInt(department_id)) ? parseInt(department_id) : null,
        teamId,
        description || null,
        alternative_workcenters || null,
        cost_per_hour && !isNaN(parseFloat(cost_per_hour)) ? parseFloat(cost_per_hour) : 0.00,
        capacity_time_efficiency && !isNaN(parseFloat(capacity_time_efficiency)) ? parseFloat(capacity_time_efficiency) : 100.00,
        oee_target && !isNaN(parseFloat(oee_target)) ? parseFloat(oee_target) : 0.00,
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      if (error.constraint === 'work_centers_code_key') {
        return res.status(400).json({ error: "Work center code already exists. Please use a unique code." });
      }
    }
    next(error);
  }
};

// Update work center
export const updateWorkCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      tag,
      location,
      department_id,
      maintenance_team_id,
      description,
      alternative_workcenters,
      cost_per_hour,
      capacity_time_efficiency,
      oee_target,
    } = req.body;
    
    const result = await pool.query(
      `UPDATE work_centers SET
        name = COALESCE($1, name),
        code = COALESCE($2, code),
        tag = COALESCE($3, tag),
        location = COALESCE($4, location),
        department_id = COALESCE($5, department_id),
        maintenance_team_id = COALESCE($6, maintenance_team_id),
        description = COALESCE($7, description),
        alternative_workcenters = COALESCE($8, alternative_workcenters),
        cost_per_hour = COALESCE($9, cost_per_hour),
        capacity_time_efficiency = COALESCE($10, capacity_time_efficiency),
        oee_target = COALESCE($11, oee_target)
      WHERE id = $12
      RETURNING *`,
      [
        name,
        code,
        tag,
        location,
        department_id,
        maintenance_team_id,
        description,
        alternative_workcenters,
        cost_per_hour,
        capacity_time_efficiency,
        oee_target,
        id,
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Work center not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};


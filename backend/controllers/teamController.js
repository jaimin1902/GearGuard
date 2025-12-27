import pool from "../db/connection.js";

// Get all teams
export const getAllTeams = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        mt.*,
        COUNT(DISTINCT tm.user_id) as member_count,
        STRING_AGG(DISTINCT u.name, ', ' ORDER BY u.name) as team_members
      FROM maintenance_teams mt
      LEFT JOIN team_members tm ON mt.id = tm.team_id
      LEFT JOIN users u ON tm.user_id = u.id
      GROUP BY mt.id
      ORDER BY mt.name`
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get team by ID with members
export const getTeamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const teamResult = await pool.query(
      "SELECT * FROM maintenance_teams WHERE id = $1",
      [id]
    );
    
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    const membersResult = await pool.query(
      `SELECT 
        tm.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.avatar_url as user_avatar,
        u.role as user_role
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.is_default DESC, u.name`,
      [id]
    );
    
    res.json({
      ...teamResult.rows[0],
      members: membersResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Create new team
export const createTeam = async (req, res, next) => {
  try {
    const { name, description, company } = req.body;
    
    const result = await pool.query(
      `INSERT INTO maintenance_teams (name, description, company)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [name, description || null, company || null]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update team
export const updateTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, company } = req.body;
    
    const result = await pool.query(
      `UPDATE maintenance_teams SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        company = COALESCE($3, company)
      WHERE id = $4
      RETURNING *`,
      [name, description, company, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Add member to team
export const addTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_id, is_default } = req.body;
    
    const result = await pool.query(
      `INSERT INTO team_members (team_id, user_id, is_default)
      VALUES ($1, $2, $3)
      ON CONFLICT (team_id, user_id) DO UPDATE SET is_default = $3
      RETURNING *`,
      [id, user_id, is_default || false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Remove member from team
export const removeTeamMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    const result = await pool.query(
      `DELETE FROM team_members
      WHERE team_id = $1 AND user_id = $2
      RETURNING *`,
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Team member not found" });
    }
    
    res.json({ message: "Team member removed successfully" });
  } catch (error) {
    next(error);
  }
};


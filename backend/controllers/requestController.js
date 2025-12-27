import pool from "../db/connection.js";

// Get all requests with filters
export const getAllRequests = async (req, res, next) => {
  try {
    const { status, type, team_id, equipment_id, assigned_to } = req.query;
    
    let query = `
      SELECT 
        mr.*,
        e.name as equipment_name,
        e.serial_number as equipment_serial,
        e.category as equipment_category,
        mt.name as team_name,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        u.avatar_url as assigned_to_avatar,
        creator.name as created_by_name,
        CASE 
          WHEN mr.scheduled_date < CURRENT_DATE AND mr.status != 'repaired' AND mr.status != 'scrapped'
          THEN TRUE
          ELSE FALSE
        END as is_overdue
      FROM maintenance_requests mr
      LEFT JOIN equipment e ON mr.equipment_id = e.id
      LEFT JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
      LEFT JOIN users u ON mr.assigned_to_user_id = u.id
      LEFT JOIN users creator ON mr.created_by_user_id = creator.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (status) {
      query += ` AND mr.status = $${paramCount++}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND mr.request_type = $${paramCount++}`;
      params.push(type);
    }
    
    if (team_id) {
      query += ` AND mr.maintenance_team_id = $${paramCount++}`;
      params.push(team_id);
    }
    
    if (equipment_id) {
      query += ` AND mr.equipment_id = $${paramCount++}`;
      params.push(equipment_id);
    }
    
    if (assigned_to) {
      query += ` AND mr.assigned_to_user_id = $${paramCount++}`;
      params.push(assigned_to);
    }
    
    query += ` ORDER BY mr.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get request by ID
export const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        mr.*,
        e.name as equipment_name,
        e.serial_number as equipment_serial,
        ec.name as equipment_category,
        e.company as company_name,
        wc.name as work_center_name,
        wc.code as work_center_code,
        mt.name as team_name,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        u.avatar_url as assigned_to_avatar,
        creator.name as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN equipment e ON mr.equipment_id = e.id
      LEFT JOIN equipment_categories ec ON e.equipment_category_id = ec.id
      LEFT JOIN work_centers wc ON mr.work_center_id = wc.id
      LEFT JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
      LEFT JOIN users u ON mr.assigned_to_user_id = u.id
      LEFT JOIN users creator ON mr.created_by_user_id = creator.id
      WHERE mr.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new request with auto-fill logic
export const createRequest = async (req, res, next) => {
  try {
    const {
      subject,
      description,
      request_type,
      maintenance_for,
      equipment_id,
      work_center_id,
      scheduled_date,
      scheduled_datetime,
      priority,
      notes,
      instructions,
      created_by_user_id,
    } = req.body;
    
    let maintenance_team_id;
    let default_technician_id;
    let category;
    
    // Auto-fill based on maintenance_for type
    if (maintenance_for === "equipment" && equipment_id) {
      const equipmentResult = await pool.query(
        `SELECT 
          e.maintenance_team_id, 
          e.default_technician_id,
          ec.name as equipment_category_name
        FROM equipment e
        LEFT JOIN equipment_categories ec ON e.equipment_category_id = ec.id
        WHERE e.id = $1`,
        [equipment_id]
      );
      
      if (equipmentResult.rows.length === 0) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      const equipment = equipmentResult.rows[0];
      maintenance_team_id = equipment.maintenance_team_id;
      default_technician_id = equipment.default_technician_id;
      category = equipment.equipment_category_name;
    } else if (maintenance_for === "work_center" && work_center_id) {
      const workCenterResult = await pool.query(
        `SELECT maintenance_team_id
        FROM work_centers
        WHERE id = $1`,
        [work_center_id]
      );
      
      if (workCenterResult.rows.length === 0) {
        return res.status(404).json({ error: "Work center not found" });
      }
      
      maintenance_team_id = workCenterResult.rows[0].maintenance_team_id;
    } else {
      return res.status(400).json({ error: "Invalid maintenance_for type or missing ID" });
    }
    
    const result = await pool.query(
      `INSERT INTO maintenance_requests (
        subject, description, request_type, maintenance_for, equipment_id, work_center_id,
        maintenance_team_id, scheduled_date, scheduled_datetime, priority, notes, instructions,
        assigned_to_user_id, created_by_user_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        subject,
        description,
        request_type,
        maintenance_for,
        equipment_id || null,
        work_center_id || null,
        maintenance_team_id,
        scheduled_date || null,
        scheduled_datetime || null,
        priority || 1,
        notes || null,
        instructions || null,
        default_technician_id || null,
        created_by_user_id,
        "new",
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update request
export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      subject,
      description,
      status,
      assigned_to_user_id,
      scheduled_date,
      scheduled_datetime,
      duration_hours,
      priority,
      notes,
      instructions,
      maintenance_for,
      equipment_id,
      work_center_id,
    } = req.body;
    
    let updateFields = [];
    let params = [];
    let paramCount = 1;
    
    if (subject !== undefined) {
      updateFields.push(`subject = $${paramCount++}`);
      params.push(subject);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      params.push(description);
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramCount++}`);
      params.push(status);
      
      // Auto-set completed_at when status is 'repaired'
      if (status === "repaired") {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }
    
    if (assigned_to_user_id !== undefined) {
      updateFields.push(`assigned_to_user_id = $${paramCount++}`);
      params.push(assigned_to_user_id);
    }
    
    if (scheduled_date !== undefined) {
      updateFields.push(`scheduled_date = $${paramCount++}`);
      params.push(scheduled_date);
    }
    
    if (duration_hours !== undefined) {
      updateFields.push(`duration_hours = $${paramCount++}`);
      params.push(duration_hours);
    }
    
    if (scheduled_datetime !== undefined) {
      updateFields.push(`scheduled_datetime = $${paramCount++}`);
      params.push(scheduled_datetime);
    }
    
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramCount++}`);
      params.push(priority);
    }
    
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      params.push(notes);
    }
    
    if (instructions !== undefined) {
      updateFields.push(`instructions = $${paramCount++}`);
      params.push(instructions);
    }
    
    if (maintenance_for !== undefined) {
      updateFields.push(`maintenance_for = $${paramCount++}`);
      params.push(maintenance_for);
    }
    
    if (equipment_id !== undefined) {
      updateFields.push(`equipment_id = $${paramCount++}`);
      params.push(equipment_id);
    }
    
    if (work_center_id !== undefined) {
      updateFields.push(`work_center_id = $${paramCount++}`);
      params.push(work_center_id);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    params.push(id);
    
    const result = await pool.query(
      `UPDATE maintenance_requests SET
        ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *`,
      params
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    // If status is scrapped, mark equipment as scrapped
    if (status === "scrapped") {
      await pool.query(
        `UPDATE equipment SET
          is_scrapped = TRUE,
          scrapped_at = CURRENT_TIMESTAMP,
          scrapped_reason = $1
        WHERE id = (SELECT equipment_id FROM maintenance_requests WHERE id = $2)`,
        [`Request ${id} was scrapped`, id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get requests for calendar (preventive maintenance)
export const getCalendarRequests = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        mr.*,
        e.name as equipment_name,
        e.serial_number as equipment_serial,
        wc.name as work_center_name,
        mt.name as team_name,
        u.name as assigned_to_name,
        u.avatar_url as assigned_to_avatar
      FROM maintenance_requests mr
      LEFT JOIN equipment e ON mr.equipment_id = e.id
      LEFT JOIN work_centers wc ON mr.work_center_id = wc.id
      LEFT JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
      LEFT JOIN users u ON mr.assigned_to_user_id = u.id
      WHERE (mr.scheduled_date IS NOT NULL OR mr.scheduled_datetime IS NOT NULL)
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      query += ` AND (mr.scheduled_date >= $${paramCount} OR mr.scheduled_datetime >= $${paramCount}::timestamp)`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND (mr.scheduled_date <= $${paramCount} OR mr.scheduled_datetime <= $${paramCount}::timestamp)`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ` ORDER BY COALESCE(mr.scheduled_datetime, mr.scheduled_date::timestamp)`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get statistics for reports
export const getRequestStatistics = async (req, res, next) => {
  try {
    const { group_by } = req.query; // 'team' or 'equipment_category'
    
    let query;
    
    if (group_by === "team") {
      query = `
        SELECT 
          mt.name as group_name,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN mr.status = 'new' THEN 1 END) as new_count,
          COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN mr.status = 'repaired' THEN 1 END) as repaired_count
        FROM maintenance_requests mr
        JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
        GROUP BY mt.name
        ORDER BY total_requests DESC
      `;
    } else if (group_by === "equipment_category") {
      query = `
        SELECT 
          e.category as group_name,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN mr.status = 'new' THEN 1 END) as new_count,
          COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as in_progress_count,
          COUNT(CASE WHEN mr.status = 'repaired' THEN 1 END) as repaired_count
        FROM maintenance_requests mr
        JOIN equipment e ON mr.equipment_id = e.id
        WHERE e.category IS NOT NULL
        GROUP BY e.category
        ORDER BY total_requests DESC
      `;
    } else {
      return res.status(400).json({ error: "Invalid group_by parameter. Use 'team' or 'equipment_category'" });
    }
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};


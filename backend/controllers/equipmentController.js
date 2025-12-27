import pool from "../db/connection.js";

// Get all equipment with filters
export const getAllEquipment = async (req, res, next) => {
  try {
    const { department_id, user_id, team_id, search } = req.query;
    
    let query = `
      SELECT 
        e.*,
        d.name as department_name,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        mt.name as maintenance_team_name,
        dt.name as default_technician_name,
        ec.name as equipment_category_name,
        wc.name as work_center_name,
        (SELECT COUNT(*) FROM maintenance_requests mr 
         WHERE mr.equipment_id = e.id AND mr.status IN ('new', 'in_progress')) as open_requests_count
      FROM equipment e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON e.assigned_to_user_id = u.id
      LEFT JOIN maintenance_teams mt ON e.maintenance_team_id = mt.id
      LEFT JOIN users dt ON e.default_technician_id = dt.id
      LEFT JOIN equipment_categories ec ON e.equipment_category_id = ec.id
      LEFT JOIN work_centers wc ON e.work_center_id = wc.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (department_id && department_id !== "undefined" && department_id !== "null") {
      const deptId = parseInt(department_id);
      if (!isNaN(deptId)) {
        query += ` AND e.department_id = $${paramCount++}`;
        params.push(deptId);
      }
    }
    
    if (user_id && user_id !== "undefined" && user_id !== "null") {
      const userId = parseInt(user_id);
      if (!isNaN(userId)) {
        query += ` AND e.assigned_to_user_id = $${paramCount++}`;
        params.push(userId);
      }
    }
    
    if (team_id && team_id !== "undefined" && team_id !== "null") {
      const teamId = parseInt(team_id);
      if (!isNaN(teamId)) {
        query += ` AND e.maintenance_team_id = $${paramCount++}`;
        params.push(teamId);
      }
    }
    
    if (search) {
      query += ` AND (e.name ILIKE $${paramCount} OR e.serial_number ILIKE $${paramCount} OR e.category ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY e.created_at DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Get single equipment by ID
export const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        e.*,
        d.name as department_name,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        mt.name as maintenance_team_name,
        dt.name as default_technician_name,
        dt.email as default_technician_email,
        ec.name as equipment_category_name,
        wc.name as work_center_name
      FROM equipment e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users u ON e.assigned_to_user_id = u.id
      LEFT JOIN maintenance_teams mt ON e.maintenance_team_id = mt.id
      LEFT JOIN users dt ON e.default_technician_id = dt.id
      LEFT JOIN equipment_categories ec ON e.equipment_category_id = ec.id
      LEFT JOIN work_centers wc ON e.work_center_id = wc.id
      WHERE e.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Create new equipment
export const createEquipment = async (req, res, next) => {
  try {
    const {
      name,
      serial_number,
      category,
      equipment_category_id,
      company,
      used_by,
      assigned_date,
      purchase_date,
      warranty_expiry_date,
      location,
      used_in_location,
      department_id,
      assigned_to_user_id,
      maintenance_team_id,
      default_technician_id,
      work_center_id,
      scrap_date,
      description,
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!maintenance_team_id) {
      return res.status(400).json({ error: "Maintenance team is required" });
    }
    if (!equipment_category_id) {
      return res.status(400).json({ error: "Equipment category is required" });
    }
    
    // Auto-generate serial number if not provided
    let finalSerialNumber = serial_number && serial_number.trim() !== "" ? serial_number.trim() : null;
    
    if (!finalSerialNumber) {
      // Get category code for serial number generation
      const categoryResult = await pool.query(
        "SELECT name FROM equipment_categories WHERE id = $1",
        [parseInt(equipment_category_id)]
      );
      
      if (categoryResult.rows.length > 0) {
        const categoryName = categoryResult.rows[0].name;
        // Get category code (first 2-3 letters, uppercase)
        let categoryCode = categoryName.substring(0, 3).toUpperCase().replace(/\s/g, '');
        // Handle special cases
        if (categoryName.toLowerCase().includes('monitor')) {
          categoryCode = 'AT';
        } else if (categoryName.toLowerCase().includes('laptop')) {
          categoryCode = 'MT';
        } else if (categoryName.toLowerCase().includes('cnc')) {
          categoryCode = 'CNC';
        }
        
        // Get count of equipment with this category
        const countResult = await pool.query(
          "SELECT COUNT(*) as count FROM equipment WHERE equipment_category_id = $1",
          [parseInt(equipment_category_id)]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        
        // Generate serial number based on category
        if (categoryCode === 'CNC') {
          // Format: CNC-001
          finalSerialNumber = `${categoryCode}-${String(count).padStart(3, '0')}`;
        } else {
          // Format: CODE/YY/SEQUENCE (e.g., AT/25/22779937, MT/22/1112222)
          const year = new Date().getFullYear().toString().slice(-2);
          const month = String(new Date().getMonth() + 1).padStart(2, '0');
          const yearMonth = `${year}${month}`;
          // Generate a longer sequence number (6-8 digits)
          const sequence = String(count * 1000 + Date.now() % 1000).padStart(6, '0');
          finalSerialNumber = `${categoryCode}/${yearMonth}/${sequence}`;
        }
      } else {
        // Fallback: use timestamp-based serial
        const year = new Date().getFullYear().toString().slice(-2);
        finalSerialNumber = `EQ/${year}/${Date.now().toString().slice(-6)}`;
      }
    }
    
    // Check for duplicate serial number
    let attempts = 0;
    while (attempts < 10) {
      const existingCheck = await pool.query(
        "SELECT id FROM equipment WHERE serial_number = $1",
        [finalSerialNumber]
      );
      if (existingCheck.rows.length === 0) {
        break; // Serial number is unique
      }
      // If duplicate, append a suffix
      finalSerialNumber = `${finalSerialNumber}-${String(attempts + 1).padStart(2, '0')}`;
      attempts++;
    }
    
    const result = await pool.query(
      `INSERT INTO equipment (
        name, serial_number, category, equipment_category_id, company, used_by, assigned_date,
        purchase_date, warranty_expiry_date, location, used_in_location,
        department_id, assigned_to_user_id, maintenance_team_id, default_technician_id,
        work_center_id, scrap_date, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name,
        finalSerialNumber,
        category || null,
        parseInt(equipment_category_id),
        company || null,
        used_by || 'employee',
        assigned_date || null,
        purchase_date || null,
        warranty_expiry_date || null,
        location || null,
        used_in_location || null,
        department_id ? parseInt(department_id) : null,
        assigned_to_user_id ? parseInt(assigned_to_user_id) : null,
        parseInt(maintenance_team_id),
        default_technician_id ? parseInt(default_technician_id) : null,
        work_center_id ? parseInt(work_center_id) : null,
        scrap_date || null,
        description || null,
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      if (error.constraint === 'equipment_serial_number_key') {
        return res.status(400).json({ error: "Serial number already exists. Please use a unique serial number." });
      }
    }
    next(error);
  }
};

// Update equipment
export const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      serial_number,
      category,
      equipment_category_id,
      company,
      used_by,
      assigned_date,
      purchase_date,
      warranty_expiry_date,
      location,
      used_in_location,
      department_id,
      assigned_to_user_id,
      maintenance_team_id,
      default_technician_id,
      work_center_id,
      scrap_date,
      description,
    } = req.body;
    
    const result = await pool.query(
      `UPDATE equipment SET
        name = COALESCE($1, name),
        serial_number = COALESCE($2, serial_number),
        category = COALESCE($3, category),
        equipment_category_id = COALESCE($4, equipment_category_id),
        company = COALESCE($5, company),
        used_by = COALESCE($6, used_by),
        assigned_date = COALESCE($7, assigned_date),
        purchase_date = COALESCE($8, purchase_date),
        warranty_expiry_date = COALESCE($9, warranty_expiry_date),
        location = COALESCE($10, location),
        used_in_location = COALESCE($11, used_in_location),
        department_id = COALESCE($12, department_id),
        assigned_to_user_id = COALESCE($13, assigned_to_user_id),
        maintenance_team_id = COALESCE($14, maintenance_team_id),
        default_technician_id = COALESCE($15, default_technician_id),
        work_center_id = COALESCE($16, work_center_id),
        scrap_date = COALESCE($17, scrap_date),
        description = COALESCE($18, description)
      WHERE id = $19
      RETURNING *`,
      [
        name || null,
        serial_number && serial_number.trim() !== "" ? serial_number.trim() : null,
        category || null,
        equipment_category_id ? parseInt(equipment_category_id) : null,
        company || null,
        used_by || null,
        assigned_date || null,
        purchase_date || null,
        warranty_expiry_date || null,
        location || null,
        used_in_location || null,
        department_id ? parseInt(department_id) : null,
        assigned_to_user_id ? parseInt(assigned_to_user_id) : null,
        maintenance_team_id ? parseInt(maintenance_team_id) : null,
        default_technician_id ? parseInt(default_technician_id) : null,
        work_center_id ? parseInt(work_center_id) : null,
        scrap_date || null,
        description || null,
        parseInt(id),
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Get maintenance requests for equipment
export const getEquipmentRequests = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        mr.*,
        e.name as equipment_name,
        mt.name as team_name,
        u.name as assigned_to_name,
        u.email as assigned_to_email,
        u.avatar_url as assigned_to_avatar,
        creator.name as created_by_name
      FROM maintenance_requests mr
      LEFT JOIN equipment e ON mr.equipment_id = e.id
      LEFT JOIN maintenance_teams mt ON mr.maintenance_team_id = mt.id
      LEFT JOIN users u ON mr.assigned_to_user_id = u.id
      LEFT JOIN users creator ON mr.created_by_user_id = creator.id
      WHERE mr.equipment_id = $1
      ORDER BY mr.created_at DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// Mark equipment as scrapped
export const scrapEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE equipment SET
        is_scrapped = TRUE,
        scrapped_at = CURRENT_TIMESTAMP,
        scrapped_reason = $1
      WHERE id = $2
      RETURNING *`,
      [reason, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipment not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};


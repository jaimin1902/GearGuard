import pool from "../db/connection.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    // Critical Equipment (Health < 30%)
    // Health is calculated based on: warranty status, number of open requests, age
    const criticalEquipment = await pool.query(
      `SELECT COUNT(*) as count
      FROM equipment e
      WHERE e.is_scrapped = FALSE
      AND (
        -- Equipment with many open requests (health indicator)
        (SELECT COUNT(*) FROM maintenance_requests mr 
         WHERE mr.equipment_id = e.id AND mr.status IN ('new', 'in_progress')) >= 3
        OR
        -- Equipment with overdue warranty
        (e.warranty_expiry_date IS NOT NULL AND e.warranty_expiry_date < CURRENT_DATE)
        OR
        -- Equipment with multiple recent requests (indicates problems)
        (SELECT COUNT(*) FROM maintenance_requests mr 
         WHERE mr.equipment_id = e.id 
         AND mr.created_at > CURRENT_DATE - INTERVAL '30 days') >= 5
      )`
    );

    // Technician Load (Utilization percentage)
    const technicianLoad = await pool.query(
      `SELECT 
        COUNT(DISTINCT mr.assigned_to_user_id) as assigned_technicians,
        COUNT(DISTINCT u.id) as total_technicians,
        CASE 
          WHEN COUNT(DISTINCT u.id) > 0 
          THEN ROUND((COUNT(DISTINCT mr.assigned_to_user_id)::DECIMAL / COUNT(DISTINCT u.id)::DECIMAL) * 100, 0)
          ELSE 0
        END as utilization_percentage
      FROM users u
      LEFT JOIN maintenance_requests mr ON u.id = mr.assigned_to_user_id 
        AND mr.status IN ('new', 'in_progress')
      WHERE u.role IN ('technician', 'manager', 'admin')`
    );

    // Open Requests
    const openRequests = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status IN ('new', 'in_progress')) as pending,
        COUNT(*) FILTER (WHERE status IN ('new', 'in_progress') 
          AND scheduled_date < CURRENT_DATE 
          AND scheduled_date IS NOT NULL) as overdue
      FROM maintenance_requests
      WHERE status IN ('new', 'in_progress')`
    );

    res.json({
      criticalEquipment: {
        count: parseInt(criticalEquipment.rows[0].count) || 0,
        threshold: 30,
      },
      technicianLoad: {
        utilization: parseInt(technicianLoad.rows[0].utilization_percentage) || 0,
        assigned: parseInt(technicianLoad.rows[0].assigned_technicians) || 0,
        total: parseInt(technicianLoad.rows[0].total_technicians) || 0,
      },
      openRequests: {
        pending: parseInt(openRequests.rows[0].pending) || 0,
        overdue: parseInt(openRequests.rows[0].overdue) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard table data (recent requests)
export const getDashboardTable = async (req, res, next) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        mr.id,
        mr.subject,
        mr.status,
        mr.request_type,
        mr.maintenance_for,
        e.name as equipment_name,
        ec.name as equipment_category,
        wc.name as work_center_name,
        creator.name as employee_name,
        creator.email as employee_email,
        technician.name as technician_name,
        technician.email as technician_email,
        d.name as department_name,
        COALESCE(e.company, 'My Company') as company_name
      FROM maintenance_requests mr
      LEFT JOIN equipment e ON mr.equipment_id = e.id
      LEFT JOIN equipment_categories ec ON e.equipment_category_id = ec.id
      LEFT JOIN work_centers wc ON mr.work_center_id = wc.id
      LEFT JOIN users creator ON mr.created_by_user_id = creator.id
      LEFT JOIN users technician ON mr.assigned_to_user_id = technician.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (search) {
      query += ` AND (mr.subject ILIKE $${paramCount} OR e.name ILIKE $${paramCount} OR creator.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
    
    query += ` ORDER BY mr.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};


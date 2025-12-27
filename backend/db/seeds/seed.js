import pool from "../connection.js";
import bcrypt from "bcryptjs";

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Create departments
    const deptResult = await client.query(
      `INSERT INTO departments (name) VALUES 
        ('Production'), 
        ('IT'), 
        ('Maintenance'), 
        ('Administration'),
        ('Quality Control'),
        ('Warehouse')
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name`
    );
    
    const departments = {};
    deptResult.rows.forEach((row) => {
      departments[row.name] = row.id;
    });
    
    // Create users
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const usersResult = await client.query(
      `INSERT INTO users (name, email, password, role, department_id) VALUES
        ('Admin User', 'admin@gearguard.com', $1, 'admin', $2),
        ('John Manager', 'manager@gearguard.com', $1, 'manager', $2),
        ('Mike Technician', 'mike@gearguard.com', $1, 'technician', $3),
        ('Sarah Technician', 'sarah@gearguard.com', $1, 'technician', $3),
        ('Tom Technician', 'tom@gearguard.com', $1, 'technician', $3),
        ('Mitchell Admin', 'mitchell@gearguard.com', $1, 'admin', $2),
        ('Abigail Peterson', 'abigail@gearguard.com', $1, 'user', $2),
        ('Tejas Modi', 'tejas@gearguard.com', $1, 'user', $2),
        ('Bhoomik P', 'bhoomik@gearguard.com', $1, 'technician', $3),
        ('Marc Demo', 'marc@gearguard.com', $1, 'technician', $3),
        ('Anas Makari', 'anas@gearguard.com', $1, 'technician', $3),
        ('Maggie Davidson', 'maggie@gearguard.com', $1, 'technician', $3),
        ('Aka Foster', 'aka@gearguard.com', $1, 'technician', $3)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, role`,
      [hashedPassword, departments["Administration"] || null, departments["Maintenance"] || null]
    );
    
    const users = {};
    usersResult.rows.forEach((row) => {
      users[row.name] = row.id;
    });
    
    // Create maintenance teams with company
    const teamsToInsert = [
      ['Mechanics', 'Mechanical maintenance team', 'My Company (San Francisco)'],
      ['Electricians', 'Electrical maintenance team', 'My Company (San Francisco)'],
      ['IT Support', 'IT and computer support team', 'My Company (San Francisco)'],
      ['Internal Maintenance', 'General internal maintenance team', 'My Company (San Francisco)'],
      ['Metrology', 'Metrology and calibration team', 'My Company (San Francisco)'],
      ['Subcontractor', 'External subcontractor team', 'My Company (San Francisco)']
    ];
    
    const teams = {};
    for (const [name, description, company] of teamsToInsert) {
      const result = await client.query(
        `INSERT INTO maintenance_teams (name, description, company)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, company = EXCLUDED.company
         RETURNING id, name`,
        [name, description, company]
      );
      if (result.rows.length > 0) {
        teams[result.rows[0].name] = result.rows[0].id;
      }
    }
    
    // Add team members (matching the image)
    if (users["Anas Makari"] && teams["Internal Maintenance"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["Internal Maintenance"], users["Anas Makari"]]
      );
    }
    
    if (users["Marc Demo"] && teams["Metrology"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["Metrology"], users["Marc Demo"]]
      );
    }
    
    if (users["Maggie Davidson"] && teams["Subcontractor"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["Subcontractor"], users["Maggie Davidson"]]
      );
    }

    // Additional team members
    if (users["Mike Technician"] && teams["Mechanics"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["Mechanics"], users["Mike Technician"]]
      );
    }
    
    if (users["Sarah Technician"] && teams["Electricians"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["Electricians"], users["Sarah Technician"]]
      );
    }
    
    if (users["Tom Technician"] && teams["IT Support"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["IT Support"], users["Tom Technician"]]
      );
    }

    if (users["Aka Foster"] && teams["Internal Maintenance"]) {
      await client.query(
        `INSERT INTO team_members (team_id, user_id, is_default)
         VALUES ($1, $2, FALSE)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [teams["Internal Maintenance"], users["Aka Foster"]]
      );
    }
    
    // Create equipment categories
    const categoriesResult = await client.query(
      `INSERT INTO equipment_categories (name, responsible_user_id) VALUES
        ('Computers', $1),
        ('Monitors', $2),
        ('Software', $1),
        ('CNC Machines', $3),
        ('Printers', $3),
        ('Vehicles', $3),
        ('Laptops', $2)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, name`,
      [
        users["Admin User"] || null,
        users["Mitchell Admin"] || null,
        users["Mike Technician"] || null,
      ]
    );
    
    const categories = {};
    categoriesResult.rows.forEach((row) => {
      categories[row.name] = row.id;
    });
    
    // Create work centers with all new fields
    const workCentersResult = await client.query(
      `INSERT INTO work_centers (
        name, code, location, department_id, maintenance_team_id, description,
        tag, alternative_workcenters, cost_per_hour, capacity_time_efficiency, oee_target
      ) VALUES
        ('Production Line A', 'WC-001', 'Factory Floor A', $1, $2, 'Main production line for assembly', 
         'Production', 'WC-002,WC-003', 150.00, 95.50, 85.00),
        ('Assembly Station B', 'WC-002', 'Factory Floor B', $1, $2, 'Assembly and packaging station', 
         'Assembly', 'WC-001,WC-004', 120.00, 92.00, 80.00),
        ('Quality Control Lab', 'WC-003', 'Building 2', $3, $4, 'Quality testing and inspection', 
         'Quality', 'WC-005', 100.00, 98.00, 90.00),
        ('Packaging Line C', 'WC-004', 'Factory Floor C', $1, $2, 'Packaging and shipping station', 
         'Packaging', 'WC-002', 110.00, 88.00, 75.00),
        ('Testing Facility', 'WC-005', 'Building 3', $3, $4, 'Product testing and validation', 
         'Testing', 'WC-003', 130.00, 90.00, 82.00),
        ('Warehouse Station', 'WC-006', 'Warehouse Area', $5, $2, 'Warehouse operations and logistics', 
         'Warehouse', 'WC-001', 90.00, 85.00, 70.00),
        ('Maintenance Bay', 'WC-007', 'Maintenance Building', $6, $7, 'Equipment maintenance and repair', 
         'Maintenance', NULL, 200.00, 100.00, 95.00)
      ON CONFLICT (code) DO NOTHING
      RETURNING id, name, code`,
      [
        departments["Production"] || null,
        teams["Mechanics"] || null,
        departments["Quality Control"] || null,
        teams["Electricians"] || null,
        departments["Warehouse"] || null,
        departments["Maintenance"] || null,
        teams["Internal Maintenance"] || null,
      ]
    );
    
    const workCenters = {};
    workCentersResult.rows.forEach((row) => {
      workCenters[row.name] = row.id;
    });
    
    // Create equipment with new fields
    const equipmentResult = await client.query(
      `INSERT INTO equipment (
        name, serial_number, category, equipment_category_id, company, used_by, assigned_date,
        purchase_date, warranty_expiry_date, location, used_in_location, department_id, 
        assigned_to_user_id, maintenance_team_id, default_technician_id, work_center_id, description
      ) VALUES
        ('Samsung Monitor 15', 'AT/125/22779937', 'Monitors', $1, 'My Company (San Francisco)', 'employee', '2024-12-24',
         '2023-01-15', '2026-01-15', 'Office Building', 'Admin Office', $2, $3, $4, $5, NULL, '15 inch Samsung monitor'),
        ('Acer Laptop', 'MT/122/1112222', 'Laptops', $6, 'My Company (San Francisco)', 'employee', '2024-11-01',
         '2023-06-01', '2025-06-01', 'Office Building', 'IT Department', $7, $8, $9, $10, NULL, 'Acer business laptop'),
        ('CNC Machine 01', 'CNC-001', 'CNC Machines', $11, 'My Company (San Francisco)', 'department', '2023-01-20',
         '2023-01-15', '2026-01-15', 'Production Floor A', 'Production Line A', $12, NULL, $13, $14, $15, 'High precision CNC machine'),
        ('Production Printer', 'PRT-001', 'Printers', $16, 'My Company (San Francisco)', 'department', '2023-03-20',
         '2023-03-15', '2025-03-15', 'Production Floor B', 'Assembly Station', $12, NULL, $13, $14, $17, 'Industrial production printer')
      ON CONFLICT (serial_number) DO UPDATE SET
        name = EXCLUDED.name,
        equipment_category_id = EXCLUDED.equipment_category_id,
        company = EXCLUDED.company,
        maintenance_team_id = EXCLUDED.maintenance_team_id
      RETURNING id, name`,
      [
        categories["Monitors"] || null,
        departments["Administration"] || null,
        users["Tejas Modi"] || null,
        teams["Internal Maintenance"] || null,
        users["Mitchell Admin"] || null,
        categories["Laptops"] || null,
        departments["IT"] || null,
        users["Bhoomik P"] || null,
        teams["IT Support"] || null,
        users["Marc Demo"] || null,
        categories["CNC Machines"] || null,
        departments["Production"] || null,
        teams["Mechanics"] || null,
        users["Mike Technician"] || null,
        workCenters["Production Line A"] || null,
        categories["Printers"] || null,
        workCenters["Assembly Station B"] || null,
      ]
    );
    
    const equipment = {};
    equipmentResult.rows.forEach((row) => {
      equipment[row.name] = row.id;
    });
    
    // Create sample maintenance requests
    let requestCount = 0;
    
    if (equipment["CNC Machine 01"]) {
      const reqResult = await client.query(
        `INSERT INTO maintenance_requests (
          subject, description, request_type, status, equipment_id, maintenance_team_id,
          scheduled_date, scheduled_datetime, maintenance_for, priority, created_by_user_id, assigned_to_user_id
        ) VALUES
          ('Routine Checkup', 'Monthly preventive maintenance', 'preventive', 'new',
           $1, $2, CURRENT_DATE + INTERVAL '7 days', CURRENT_TIMESTAMP + INTERVAL '7 days 14 hours', 'equipment', 2, $3, $4),
          ('Oil Leak', 'Machine is leaking oil', 'corrective', 'in_progress',
           $1, $2, NULL, NULL, 'equipment', 3, $3, $4),
          ('Test activity', 'Test maintenance request', 'corrective', 'new',
           $1, $2, CURRENT_DATE, CURRENT_TIMESTAMP + INTERVAL '1 day 14 hours 30 minutes', 'equipment', 2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          equipment["CNC Machine 01"],
          teams["Mechanics"] || null,
          users["John Manager"] || null,
          users["Mike Technician"] || null,
        ]
      );
      requestCount += reqResult.rows.length;
    }
    
    if (equipment["Samsung Monitor 15"]) {
      const reqResult = await client.query(
        `INSERT INTO maintenance_requests (
          subject, description, request_type, status, equipment_id, maintenance_team_id,
          scheduled_date, scheduled_datetime, maintenance_for, priority, created_by_user_id, assigned_to_user_id
        ) VALUES
          ('Display Calibration', 'Monitor color calibration', 'preventive', 'new',
           $1, $2, CURRENT_DATE + INTERVAL '3 days', CURRENT_TIMESTAMP + INTERVAL '3 days 10 hours', 'equipment', 1, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          equipment["Samsung Monitor 15"],
          teams["Internal Maintenance"] || null,
          users["Mitchell Admin"] || null,
          users["Aka Foster"] || null,
        ]
      );
      requestCount += reqResult.rows.length;
    }
    
    if (equipment["Acer Laptop"]) {
      const reqResult = await client.query(
        `INSERT INTO maintenance_requests (
          subject, description, request_type, status, equipment_id, maintenance_team_id,
          scheduled_date, scheduled_datetime, maintenance_for, priority, created_by_user_id, assigned_to_user_id
        ) VALUES
          ('Battery Check', 'Laptop battery health check', 'preventive', 'new',
           $1, $2, CURRENT_DATE + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days 16 hours', 'equipment', 2, $3, $4),
          ('new', 'New maintenance request', 'corrective', 'new',
           $1, $2, CURRENT_DATE, CURRENT_TIMESTAMP + INTERVAL '2 days 9 hours', 'equipment', 1, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          equipment["Acer Laptop"],
          teams["Internal Maintenance"] || null,
          users["Admin User"] || null,
          users["Anas Makari"] || null,
        ]
      );
      requestCount += reqResult.rows.length;
    }
    
    // Create work center maintenance requests
    if (workCenters["Production Line A"]) {
      const reqResult = await client.query(
        `INSERT INTO maintenance_requests (
          subject, description, request_type, status, work_center_id, maintenance_team_id,
          scheduled_date, scheduled_datetime, maintenance_for, priority, created_by_user_id, assigned_to_user_id
        ) VALUES
          ('Line Calibration', 'Quarterly calibration check', 'preventive', 'new',
           $1, $2, CURRENT_DATE + INTERVAL '14 days', CURRENT_TIMESTAMP + INTERVAL '14 days 8 hours', 'work_center', 2, $3, $4),
          ('Belt Replacement', 'Conveyor belt needs replacement', 'corrective', 'new',
           $1, $2, NULL, NULL, 'work_center', 3, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          workCenters["Production Line A"],
          teams["Mechanics"] || null,
          users["John Manager"] || null,
          users["Mike Technician"] || null,
        ]
      );
      requestCount += reqResult.rows.length;
    }

    if (workCenters["Assembly Station B"]) {
      const reqResult = await client.query(
        `INSERT INTO maintenance_requests (
          subject, description, request_type, status, work_center_id, maintenance_team_id,
          scheduled_date, scheduled_datetime, maintenance_for, priority, created_by_user_id, assigned_to_user_id
        ) VALUES
          ('Monthly Inspection', 'Regular monthly inspection', 'preventive', 'new',
           $1, $2, CURRENT_DATE + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days 12 hours', 'work_center', 2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          workCenters["Assembly Station B"],
          teams["Mechanics"] || null,
          users["John Manager"] || null,
          users["Mike Technician"] || null,
        ]
      );
      requestCount += reqResult.rows.length;
    }
    
    if (workCenters["Quality Control Lab"]) {
      const reqResult = await client.query(
        `INSERT INTO maintenance_requests (
          subject, description, request_type, status, work_center_id, maintenance_team_id,
          scheduled_date, scheduled_datetime, maintenance_for, priority, created_by_user_id
        ) VALUES
          ('Equipment Testing', 'Quality control equipment testing', 'preventive', 'new',
           $1, $2, CURRENT_DATE + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '10 days 11 hours', 'work_center', 2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [
          workCenters["Quality Control Lab"],
          teams["Electricians"] || null,
          users["John Manager"] || null,
        ]
      );
      requestCount += reqResult.rows.length;
    }
    
    await client.query("COMMIT");
    console.log("✓ Seed data created successfully!");
    console.log(`  - ${deptResult.rows.length} departments`);
    console.log(`  - ${usersResult.rows.length} users`);
    console.log(`  - ${Object.keys(teams).length} maintenance teams`);
    console.log(`  - ${categoriesResult.rows.length} equipment categories`);
    console.log(`  - ${workCentersResult.rows.length} work centers`);
    console.log(`  - ${equipmentResult.rows.length} equipment items`);
    console.log(`  - ${requestCount} maintenance requests`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding error:", error);
    process.exit(1);
  });

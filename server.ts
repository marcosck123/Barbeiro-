import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('barber.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    username TEXT,
    role TEXT DEFAULT 'customer'
  );

  CREATE TABLE IF NOT EXISTS haircuts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    image TEXT,
    description TEXT,
    price REAL,
    estimated_time INTEGER
  );

  CREATE TABLE IF NOT EXISTS barbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    bio TEXT,
    commission_rate REAL DEFAULT 0.3,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barber_id INTEGER,
    start_time TEXT,
    end_time TEXT,
    is_booked INTEGER DEFAULT 0,
    FOREIGN KEY(barber_id) REFERENCES barbers(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    barber_id INTEGER,
    haircut_id INTEGER,
    start_time TEXT,
    status TEXT DEFAULT 'scheduled',
    payment_method TEXT,
    total_price REAL,
    change_amount REAL DEFAULT 0,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(barber_id) REFERENCES barbers(id),
    FOREIGN KEY(haircut_id) REFERENCES haircuts(id)
  );
`);

// Seed Admin User
const seedAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get('marcoseduardock@gmail.com');
if (!seedAdmin) {
  db.prepare('INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)').run(
    'marcoseduardock@gmail.com',
    '123456',
    'Admin Marcos',
    'admin'
  );
}

// Seed Initial Haircuts
const haircutCount = db.prepare('SELECT COUNT(*) as count FROM haircuts').get() as { count: number };
if (haircutCount.count === 0) {
  const initialHaircuts = [
    {
      name: 'Degradê Moderno',
      image: 'https://images.unsplash.com/photo-1599351431247-f10b21816381?q=80&w=800&auto=format&fit=crop',
      description: 'Um corte limpo com transição suave nas laterais, perfeito para o dia a dia.',
      price: 45.00,
      estimated_time: 40
    },
    {
      name: 'Pompadour Clássico',
      image: 'https://images.unsplash.com/photo-1621605815841-287940719019?q=80&w=800&auto=format&fit=crop',
      description: 'Volume no topo com um acabamento refinado para um visual atemporal.',
      price: 60.00,
      estimated_time: 50
    },
    {
      name: 'Barba de Respeito',
      image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop',
      description: 'Modelagem completa da barba com toalha quente e produtos premium.',
      price: 35.00,
      estimated_time: 30
    },
    {
      name: 'Corte & Barba Combo',
      image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
      description: 'O pacote completo para renovar seu visual com o máximo de cuidado.',
      price: 90.00,
      estimated_time: 75
    }
  ];

  const insertHaircut = db.prepare('INSERT INTO haircuts (name, image, description, price, estimated_time) VALUES (?, ?, ?, ?, ?)');
  initialHaircuts.forEach(h => insertHaircut.run(h.name, h.image, h.description, h.price, h.estimated_time));
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { email, password, username, role } = req.body;
    try {
      const result = db.prepare('INSERT INTO users (email, password, username, role) VALUES (?, ?, ?, ?)').run(email, password, username, role || 'customer');
      res.json({ id: result.lastInsertRowid, email, username, role: role || 'customer' });
    } catch (e) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Haircut Routes
  app.get('/api/haircuts', (req, res) => {
    const haircuts = db.prepare('SELECT * FROM haircuts').all();
    res.json(haircuts);
  });

  app.post('/api/haircuts', (req, res) => {
    const { name, image, description, price, estimated_time } = req.body;
    const result = db.prepare('INSERT INTO haircuts (name, image, description, price, estimated_time) VALUES (?, ?, ?, ?, ?)').run(name, image, description, price, estimated_time);
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  // Barber Routes
  app.get('/api/barbers', (req, res) => {
    const barbers = db.prepare('SELECT * FROM barbers').all();
    res.json(barbers);
  });

  app.get('/api/barbers/:id', (req, res) => {
    const barber = db.prepare('SELECT * FROM barbers WHERE id = ?').get(req.params.id);
    res.json(barber);
  });

  app.post('/api/barbers', (req, res) => {
    const { user_id, name, bio, commission_rate } = req.body;
    const result = db.prepare('INSERT INTO barbers (user_id, name, bio, commission_rate) VALUES (?, ?, ?, ?)').run(user_id, name, bio, commission_rate);
    res.json({ id: result.lastInsertRowid, ...req.body });
  });

  // Availability Routes
  app.get('/api/availability/:barberId', (req, res) => {
    const slots = db.prepare('SELECT * FROM availability WHERE barber_id = ? AND is_booked = 0').all(req.params.barberId);
    res.json(slots);
  });

  app.post('/api/availability', (req, res) => {
    const { barber_id, start_time, end_time } = req.body;
    db.prepare('INSERT INTO availability (barber_id, start_time, end_time) VALUES (?, ?, ?)').run(barber_id, start_time, end_time);
    res.json({ success: true });
  });

  // Appointment Routes
  app.post('/api/appointments', (req, res) => {
    const { customer_id, barber_id, haircut_id, start_time, payment_method, total_price, change_amount, slot_id } = req.body;
    
    const result = db.prepare(`
      INSERT INTO appointments (customer_id, barber_id, haircut_id, start_time, payment_method, total_price, change_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(customer_id, barber_id, haircut_id, start_time, payment_method, total_price, change_amount);

    if (slot_id) {
      db.prepare('UPDATE availability SET is_booked = 1 WHERE id = ?').run(slot_id);
    }

    // Mock Email Notification
    console.log(`[EMAIL] Confirmation sent to customer and barber for appointment at ${start_time}`);

    res.json({ id: result.lastInsertRowid });
  });

  // Background Task: 24h Reminder Simulation
  setInterval(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const upcoming = db.prepare(`
      SELECT a.*, u.email as customer_email, u.username as customer_name
      FROM appointments a
      JOIN users u ON a.customer_id = u.id
      WHERE a.start_time LIKE ? AND a.status = 'scheduled'
    `).all(`${tomorrowStr}%`);

    upcoming.forEach((app: any) => {
      console.log(`[EMAIL] 24h Reminder sent to ${app.customer_name} (${app.customer_email}) for appointment at ${app.start_time}`);
    });
  }, 60000); // Check every minute

  app.get('/api/appointments/history/:barberId', (req, res) => {
    const history = db.prepare(`
      SELECT a.*, h.name as haircut_name, h.price, b.commission_rate
      FROM appointments a
      JOIN haircuts h ON a.haircut_id = h.id
      JOIN barbers b ON a.barber_id = b.id
      WHERE a.barber_id = ?
    `).all(req.params.barberId);
    res.json(history);
  });

  app.get('/api/admin/reports', (req, res) => {
    const reports = db.prepare(`
      SELECT b.name as barber_name, b.commission_rate, SUM(a.total_price) as total_revenue,
             SUM(a.total_price * b.commission_rate) as total_commission
      FROM appointments a
      JOIN barbers b ON a.barber_id = b.id
      GROUP BY b.id
    `).all();
    res.json(reports);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

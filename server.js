const express    = require('express');
const multer     = require('multer');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const session    = require('express-session');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'agunta_secret_key_2026';

// ─── Directories ──────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR  = path.join(__dirname, 'public');
[DATA_DIR, UPLOADS_DIR, PUBLIC_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ─── Data files ───────────────────────────────────────────────────────────────
const PROJECTS_FILE  = path.join(DATA_DIR, 'projects.json');
const MESSAGES_FILE  = path.join(DATA_DIR, 'messages.json');
const SETTINGS_FILE  = path.join(DATA_DIR, 'settings.json');
const USERS_FILE     = path.join(DATA_DIR, 'users.json');
const MACHINES_FILE  = path.join(DATA_DIR, 'machines.json');
const PAGES_FILE     = path.join(DATA_DIR, 'pages.json');

function loadJSON(file, def = []) {
  if (!fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(def, null, 2)); return def; }
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; }
}
function saveJSON(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// ─── Seeds ────────────────────────────────────────────────────────────────────
(function seedAdmin() {
  let users = loadJSON(USERS_FILE, []);
  if (!users.find(u => u.username === 'admin')) {
    users.push({ id: uuidv4(), username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'Admin User', createdAt: new Date().toISOString() });
    saveJSON(USERS_FILE, users);
    console.log('Default admin created  →  username: admin  password: admin123');
  }
})();

(function seedSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    saveJSON(SETTINGS_FILE, {
      siteName: 'Agunta Construction Ltd', heroTitle: "Building Africa's Future",
      heroSub: 'From residential towers in Kampala to highway networks across Africa.',
      phone: '+256 758 975 266', email: 'info@aguntaconstruction.com',
      whatsapp: '256758975266', address: 'Kabalagala, Kampala, Uganda'
    });
  }
})();

(function seedProjects() {
  let p = loadJSON(PROJECTS_FILE, []);
  if (p.length === 0) {
    saveJSON(PROJECTS_FILE, [
      { id: uuidv4(), title: 'Concord Apartments Nakasero', category: 'residential', status: 'completed', location: 'Nakasero, Kampala', client: 'Private Client', duration: '2021–2023', description: '4 blocks comprising 64 apartments with spacious penthouses.', image: null, featured: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), title: 'CK Apartments', category: 'residential', status: 'ongoing', location: 'Kampala', client: 'CK and Company', duration: '2025–Present', description: '2 blocks of G+7 buildings including 4 penthouses and 24 apartments.', image: null, featured: false, createdAt: new Date().toISOString() },
    ]);
  }
})();

(function seedMachines() {
  if (!fs.existsSync(MACHINES_FILE)) {
    saveJSON(MACHINES_FILE, [
      { id: uuidv4(), name: 'CAT 320 Excavator', category: 'excavation', description: '20-tonne hydraulic excavator for earthworks and foundation digging.', specs: '20t operating weight · 1.2m³ bucket · 140kW engine', image: null, available: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Volvo A40G Dump Truck', category: 'haulage', description: 'Articulated dump truck for bulk material transport on rough terrain.', specs: '39t payload · 6×6 drive · 294kW engine', image: null, available: true, createdAt: new Date().toISOString() },
      { id: uuidv4(), name: 'Concrete Mixer 8m³', category: 'concrete', description: 'Transit mixer for ready-mix concrete delivery on site.', specs: '8m³ drum · Mercedes chassis · hydraulic discharge', image: null, available: true, createdAt: new Date().toISOString() },
    ]);
  }
})();

(function seedPages() {
  if (!fs.existsSync(PAGES_FILE)) {
    saveJSON(PAGES_FILE, {
      mvv: {
        mission: 'To deliver high-quality construction and engineering solutions at fair and competitive prices through professionalism, innovation, safety, and efficient project execution.',
        vision:  'To become a leading and trusted construction and real estate development company in East Africa, recognized for excellence, integrity, and sustainable infrastructure development.',
        values:  'Integrity in every decision. Precision in every pour. Partnership with every client. Safety for every worker. These are not policies — they are who we are.'
      },
      certs: {
        items: [
          {icon:'fa-certificate',     title:'ISO 9001:2015',                    desc:'Quality Management System ensuring consistent, high-standard delivery.'},
          {icon:'fa-shield-halved',   title:'ISO 45001 — Safety',               desc:'Occupational Health & Safety Management System.'},
          {icon:'fa-leaf',            title:'ISO 14001 — Environment',           desc:'Environmental Management System ensuring minimal ecological impact.'},
          {icon:'fa-building-columns',title:'Uganda National Roads Authority',   desc:'Certified contractor for UNRA infrastructure projects.'},
          {icon:'fa-hammer',          title:'Uganda Registration of Engineers',   desc:'Full registration with URE, maintaining professional engineering standards.'},
          {icon:'fa-globe-africa',    title:'Multi-National Operating Licences', desc:'Fully licensed and compliant in Uganda, South Sudan, Ethiopia and Eritrea.'}
        ]
      },
      index: {
        heroTitle: 'We Build <span>Africa\'s</span> Future',
        heroSub: 'A multinational civil engineering company headquartered in Kampala, Uganda, with operations across five African nations.',
        aboutTitle: 'About Agunta Construction',
        aboutText: 'Since 2007, Agunta Construction Ltd has delivered landmark projects across East and West Africa. From high-rise apartments in Kampala to military cantonments and telecom infrastructure — we combine engineering excellence with African expertise.',
        statsYears: '17+', statsProjects: '120+', statsCountries: '5', statsValue: '$2.4B+'
      },
      about: {
        heroTitle: 'Building Africa Since 2007',
        heroSub: 'A story of precision, commitment and lasting impact across five nations.',
        storyTitle: 'Our Story',
        storyText: 'Agunta Construction Ltd was founded in Kampala, Uganda in 2007 with a vision to deliver world-class construction services across Africa. Over 17 years we have grown from a local contractor to a multinational engineering firm operating in Uganda, South Sudan, Ethiopia, Eritrea and Ghana.',
        visionText: 'To be the leading construction and engineering company in Africa, known for quality, innovation and integrity.',
        missionText: 'To deliver exceptional construction services that meet international standards while creating lasting value for our clients and communities across Africa.'
      },
      contact: {
        heroTitle: "LET'S BUILD Together.",
        heroSub: 'Whether you have a project in mind or a question about our services — our team responds within 24 hours.',
        phone: '+256 393 242 285',
        email: 'aguntacon@gmail.com',
        address: 'Kabalagala, Kampala, Uganda',
        hours: 'Mon – Fri: 8:00 AM – 6:00 PM EAT'
      }
    });
  }
})();

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => cb(null, `upload_${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /jpeg|jpg|png|webp/.test(file.mimetype))
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/projects',  (req, res) => res.json(loadJSON(PROJECTS_FILE, [])));
app.get('/api/machines',  (req, res) => res.json(loadJSON(MACHINES_FILE, [])));
app.get('/api/settings',  (req, res) => res.json(loadJSON(SETTINGS_FILE, {})));
app.get('/api/pages',     (req, res) => res.json(loadJSON(PAGES_FILE, {})));
app.get('/api/pages/:page', (req, res) => {
  const pages = loadJSON(PAGES_FILE, {});
  res.json(pages[req.params.page] || {});
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, projectType, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required.' });
  const messages = loadJSON(MESSAGES_FILE, []);
  messages.unshift({ id: uuidv4(), name: name.trim(), email: email.trim(), phone: phone?.trim()||'', projectType: projectType?.trim()||'', message: message.trim(), read: false, createdAt: new Date().toISOString() });
  saveJSON(MESSAGES_FILE, messages);
  res.json({ success: true, message: 'Message received. We will get back to you shortly.' });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadJSON(USERS_FILE, []);
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — PROJECTS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/projects', requireAuth, (req, res) => res.json(loadJSON(PROJECTS_FILE, [])));

app.post('/api/admin/projects', requireAuth, upload.single('image'), (req, res) => {
  const { title, category, status, location, client, duration, description, featured } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Title and category are required.' });
  const projects = loadJSON(PROJECTS_FILE, []);
  if (featured === 'true') projects.forEach(p => p.featured = false);
  projects.unshift({ id: uuidv4(), title: title.trim(), category: category.trim(), status: status||'ongoing', location: location?.trim()||'', client: client?.trim()||'', duration: duration?.trim()||'', description: description?.trim()||'', image: req.file ? `/uploads/${req.file.filename}` : null, featured: featured === 'true', createdAt: new Date().toISOString() });
  saveJSON(PROJECTS_FILE, projects);
  res.json({ success: true, project: projects[0] });
});

app.put('/api/admin/projects/:id', requireAuth, upload.single('image'), (req, res) => {
  const projects = loadJSON(PROJECTS_FILE, []);
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  const { title, category, status, location, client, duration, description, featured } = req.body;
  if (featured === 'true') projects.forEach(p => p.featured = false);
  const updated = { ...projects[idx], title: title?.trim()||projects[idx].title, category: category?.trim()||projects[idx].category, status: status||projects[idx].status, location: location?.trim()??projects[idx].location, client: client?.trim()??projects[idx].client, duration: duration?.trim()??projects[idx].duration, description: description?.trim()??projects[idx].description, featured: featured === 'true', updatedAt: new Date().toISOString() };
  if (req.file) {
    if (projects[idx].image?.startsWith('/uploads/')) { const f = path.join(__dirname, projects[idx].image); if (fs.existsSync(f)) fs.unlinkSync(f); }
    updated.image = `/uploads/${req.file.filename}`;
  }
  projects[idx] = updated;
  saveJSON(PROJECTS_FILE, projects);
  res.json({ success: true, project: updated });
});

app.delete('/api/admin/projects/:id', requireAuth, (req, res) => {
  let projects = loadJSON(PROJECTS_FILE, []);
  const p = projects.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found.' });
  if (p.image?.startsWith('/uploads/')) { const f = path.join(__dirname, p.image); if (fs.existsSync(f)) fs.unlinkSync(f); }
  saveJSON(PROJECTS_FILE, projects.filter(x => x.id !== req.params.id));
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — MACHINES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/machines', requireAuth, (req, res) => res.json(loadJSON(MACHINES_FILE, [])));

app.post('/api/admin/machines', requireAuth, upload.single('image'), (req, res) => {
  const { name, category, description, specs, available } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  const machines = loadJSON(MACHINES_FILE, []);
  const m = { id: uuidv4(), name: name.trim(), category: category?.trim()||'general', description: description?.trim()||'', specs: specs?.trim()||'', image: req.file ? `/uploads/${req.file.filename}` : null, available: available !== 'false', createdAt: new Date().toISOString() };
  machines.unshift(m);
  saveJSON(MACHINES_FILE, machines);
  res.json({ success: true, machine: m });
});

app.put('/api/admin/machines/:id', requireAuth, upload.single('image'), (req, res) => {
  const machines = loadJSON(MACHINES_FILE, []);
  const idx = machines.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found.' });
  const { name, category, description, specs, available } = req.body;
  const updated = { ...machines[idx], name: name?.trim()||machines[idx].name, category: category?.trim()||machines[idx].category, description: description?.trim()??machines[idx].description, specs: specs?.trim()??machines[idx].specs, available: available !== 'false', updatedAt: new Date().toISOString() };
  if (req.file) {
    if (machines[idx].image?.startsWith('/uploads/')) { const f = path.join(__dirname, machines[idx].image); if (fs.existsSync(f)) fs.unlinkSync(f); }
    updated.image = `/uploads/${req.file.filename}`;
  }
  machines[idx] = updated;
  saveJSON(MACHINES_FILE, machines);
  res.json({ success: true, machine: updated });
});

app.delete('/api/admin/machines/:id', requireAuth, (req, res) => {
  let machines = loadJSON(MACHINES_FILE, []);
  const m = machines.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found.' });
  if (m.image?.startsWith('/uploads/')) { const f = path.join(__dirname, m.image); if (fs.existsSync(f)) fs.unlinkSync(f); }
  saveJSON(MACHINES_FILE, machines.filter(x => x.id !== req.params.id));
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — MESSAGES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/messages',          requireAuth, (req, res) => res.json(loadJSON(MESSAGES_FILE, [])));
app.patch('/api/admin/messages/:id/read', requireAuth, (req, res) => {
  const messages = loadJSON(MESSAGES_FILE, []);
  const m = messages.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found.' });
  m.read = true; saveJSON(MESSAGES_FILE, messages); res.json({ success: true });
});
app.delete('/api/admin/messages/:id', requireAuth, (req, res) => {
  let messages = loadJSON(MESSAGES_FILE, []);
  if (!messages.find(m => m.id === req.params.id)) return res.status(404).json({ error: 'Not found.' });
  saveJSON(MESSAGES_FILE, messages.filter(m => m.id !== req.params.id));
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — USERS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/users', requireAuth, (req, res) => {
  const users = loadJSON(USERS_FILE, []).map(u => ({ id: u.id, username: u.username, name: u.name, role: u.role, createdAt: u.createdAt }));
  res.json(users);
});

app.post('/api/admin/users', requireAuth, (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Username, password and name are required.' });
  const users = loadJSON(USERS_FILE, []);
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Username already exists.' });
  const newUser = { id: uuidv4(), username: username.trim(), password: bcrypt.hashSync(password, 10), name: name.trim(), role: role||'editor', createdAt: new Date().toISOString() };
  users.push(newUser);
  saveJSON(USERS_FILE, users);
  res.json({ success: true, user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role, createdAt: newUser.createdAt } });
});

app.put('/api/admin/users/:id', requireAuth, (req, res) => {
  const users = loadJSON(USERS_FILE, []);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found.' });
  const { name, role, password } = req.body;
  if (name) users[idx].name = name.trim();
  if (role) users[idx].role = role;
  if (password) users[idx].password = bcrypt.hashSync(password, 10);
  saveJSON(USERS_FILE, users);
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', requireAuth, (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
  let users = loadJSON(USERS_FILE, []);
  if (!users.find(u => u.id === req.params.id)) return res.status(404).json({ error: 'User not found.' });
  saveJSON(USERS_FILE, users.filter(u => u.id !== req.params.id));
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — SETTINGS & PAGES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/admin/settings', requireAuth, (req, res) => res.json(loadJSON(SETTINGS_FILE, {})));
app.put('/api/admin/settings', requireAuth, (req, res) => {
  const current = loadJSON(SETTINGS_FILE, {});
  ['siteName','heroTitle','heroSub','phone','email','whatsapp','address'].forEach(k => { if (req.body[k] !== undefined) current[k] = req.body[k]; });
  saveJSON(SETTINGS_FILE, current);
  res.json({ success: true, settings: current });
});

app.get('/api/admin/pages', requireAuth, (req, res) => res.json(loadJSON(PAGES_FILE, {})));
app.put('/api/admin/pages/:page', requireAuth, (req, res) => {
  const pages = loadJSON(PAGES_FILE, {});
  pages[req.params.page] = { ...(pages[req.params.page]||{}), ...req.body };
  saveJSON(PAGES_FILE, pages);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// SERVE
// ══════════════════════════════════════════════════════════════════════════════
app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.get('/',      (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
  const page = path.join(PUBLIC_DIR, req.path.endsWith('.html') ? req.path.slice(1) : 'index.html');
  if (fs.existsSync(page)) return res.sendFile(page);
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅  Agunta Construction running on http://localhost:${PORT}`);
  console.log(`📋  Admin → http://localhost:${PORT}/admin`);
  console.log(`🔑  Login: admin / admin123\n`);
});

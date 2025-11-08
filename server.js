const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3020;

// Middleware
app.use(express.json()); // for parsing application/json
app.use(session({
  secret: 'your-secret-key', // It's recommended to use an environment variable for this
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if you're using https
}));

// Protect admin page before serving static files
app.get('/admin.html', (req, res, next) => {
    console.log('--- ADMIN PAGE ACCESS ATTEMPT ---');
    console.log('Session ID:', req.session.id);
    console.log('isAuthenticated:', req.session.isAuthenticated);
    if (req.session.isAuthenticated) {
        console.log('Access GRANTED.');
        next();
    } else {
        console.log('Access DENIED. Redirecting to portal.');
        res.redirect('/portal.html');
    }
});

// Multer setup for file uploads
const upload = multer({ dest: 'public/uploads/' });

// -- Helper Functions for JSON file I/O --
const getConfigPath = (fileName) => path.join(__dirname, 'config', `${fileName}.json`);

const readConfig = async (fileName) => {
  try {
    const filePath = getConfigPath(fileName);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}; // Return empty object if file doesn't exist
    }
    console.error(`Error reading config file ${fileName}:`, error);
    throw error;
  }
};

const writeConfig = async (fileName, data) => {
  try {
    const filePath = getConfigPath(fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing config file ${fileName}:`, error);
    throw error;
  }
};

// -- API Endpoints --

// Special endpoint for hero section with file uploads
app.get('/api/hero/settings', async (req, res) => {
    try {
        const config = await readConfig('heroSettings');
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read hero settings.' });
    }
});

app.post('/api/hero/settings', upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'logo', maxCount: 1 }
]), async (req, res) => {
    try {
        const config = await readConfig('heroSettings');
        
        const newConfig = {
            videoUrl: req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : config.videoUrl,
            logoUrl: req.files['logo'] ? `/uploads/${req.files['logo'][0].filename}` : config.logoUrl
        };

        await writeConfig('heroSettings', newConfig);
        res.json({ success: true, settings: newConfig });
    } catch (error) {
        console.error('Error saving hero settings:', error);
        res.status(500).json({ error: 'Failed to save hero settings.' });
    }
});


// Generic endpoint handler
const createConfigEndpoints = (appName, fileName) => {
  app.get(`/api/${appName}`, async (req, res) => {
    try {
      const config = await readConfig(fileName);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Failed to read settings.' });
    }
  });

  app.post(`/api/${appName}`, async (req, res) => {
    try {
      await writeConfig(fileName, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save settings.' });
    }
  });
};

createConfigEndpoints('testimonials', 'testimonials');
createConfigEndpoints('video-gallery', 'videoGallery');
createConfigEndpoints('social-media/settings', 'socialMedia');
createConfigEndpoints('phone/settings', 'phone');

// Special endpoint for services with file uploads
app.post('/api/services', upload.fields([
    { name: 'service-buying-photo', maxCount: 1 },
    { name: 'service-selling-photo', maxCount: 1 },
    { name: 'service-invest-photo', maxCount: 1 }
]), async (req, res) => {
    try {
        const config = await readConfig('services');
        const { buying_title, buying_message, selling_title, selling_message, invest_title, invest_message } = req.body;

        const newConfig = {
            buying: {
                title: buying_title,
                message: buying_message,
                photo: req.files['service-buying-photo'] ? `/uploads/${req.files['service-buying-photo'][0].filename}` : config.buying?.photo
            },
            selling: {
                title: selling_title,
                message: selling_message,
                photo: req.files['service-selling-photo'] ? `/uploads/${req.files['service-selling-photo'][0].filename}` : config.selling?.photo
            },
            invest: {
                title: invest_title,
                message: invest_message,
                photo: req.files['service-invest-photo'] ? `/uploads/${req.files['service-invest-photo'][0].filename}` : config.invest?.photo
            }
        };

        await writeConfig('services', newConfig);
        res.json({ success: true, settings: newConfig });
    } catch (error) {
        console.error('Error saving services settings:', error);
        res.status(500).json({ error: 'Failed to save services settings.' });
    }
});

// Special endpoint for about me with file upload
app.post('/api/about-me', upload.single('photo'), async (req, res) => {
    try {
        const config = await readConfig('aboutMeSettings');
        const { title, description } = req.body;

        const newConfig = {
            title,
            description,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : config.imageUrl
        };

        await writeConfig('aboutMeSettings', newConfig);
        res.json({ success: true, settings: newConfig });
    } catch (error) {
        console.error('Error saving about me settings:', error);
        res.status(500).json({ error: 'Failed to save about me settings.' });
    }
});

app.get('/api/services', async (req, res) => {
  try {
    const config = await readConfig('services');
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read services settings.' });
  }
});

app.get('/api/about-me', async (req, res) => {
  try {
    const config = await readConfig('aboutMeSettings');
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read about me settings.' });
  }
});

// -- Auth Endpoints --
const authCheck = (req, res, next) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('--- LOGIN ATTEMPT ---');
        console.log('Received Email:', email);
        console.log('Received Password:', password);

        const authConfig = await readConfig('auth');
        console.log('Loaded Auth Config:', authConfig);
        
        if (email === authConfig.email && password === authConfig.password) {
            req.session.isAuthenticated = true;
            console.log('--- LOGIN SUCCESS ---');
            console.log('Session ID:', req.session.id);
            console.log('isAuthenticated set to:', req.session.isAuthenticated);
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.get('/api/auth/logout', (req, res) => {
    const sessionId = req.session.id;
    console.log('--- LOGOUT ATTEMPT ---');
    console.log('Session ID before destroy:', sessionId);
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.redirect('/');
        }
        console.log('Session destroyed successfully for ID:', sessionId);
        res.redirect('/portal.html');
    });
});

// -- Nodemailer Endpoints --
const nodemailer = require('nodemailer');

async function resolveEmailSettings() {
    const fileConfig = await readConfig('emailSettings');
    return {
        senderEmail: process.env.EMAIL_SENDER || fileConfig.senderEmail || '',
        appPassword: process.env.EMAIL_APP_PASSWORD || fileConfig.appPassword || '',
        recipientEmail: process.env.EMAIL_RECIPIENT || fileConfig.recipientEmail || '',
        host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.EMAIL_SMTP_PORT || 465),
    };
}

async function createTransporter() {
    try {
        const emailConfig = await resolveEmailSettings();

        if (!emailConfig.senderEmail || !emailConfig.appPassword || !emailConfig.recipientEmail) {
            console.error('Email settings are incomplete. senderEmail/appPassword/recipientEmail are required.');
            return null;
        }

        const transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.port === 465,
            auth: {
                user: emailConfig.senderEmail,
                pass: emailConfig.appPassword,
            },
        });

        return { transporter, emailConfig };
    } catch (error) {
        console.error('Failed to create Nodemailer transporter:', error);
        return null;
    }
}

app.post('/api/email/contact', async (req, res) => {
    try {
        const { name, email, phone, message, interests } = req.body;
        const mailContext = await createTransporter();
        if (!mailContext) {
            return res.status(500).json({ error: 'Email service is not configured.' });
        }

        const { transporter, emailConfig } = mailContext;
        const safeInterests = Array.isArray(interests) ? interests : [];

        await transporter.sendMail({
            from: `"${name}" <${emailConfig.senderEmail}>`,
            to: emailConfig.recipientEmail,
            replyTo: email,
            subject: 'New Contact Form Submission from AZHomesbyIris',
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Interests:</strong> ${safeInterests.length ? safeInterests.join(', ') : 'None specified'}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to send contact email:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

app.get('/api/email/settings', async (req, res) => {
    try {
        const config = await readConfig('emailSettings');
        res.json({
            senderEmail: config.senderEmail,
            recipientEmail: config.recipientEmail,
            hasPassword: !!config.appPassword
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read email settings.' });
    }
});

app.post('/api/email/settings/verify', async (req, res) => {
    const { appPassword, senderEmail } = req.body;
    try {
        const host = process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.EMAIL_SMTP_PORT || 465);

        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user: senderEmail, pass: appPassword },
        });
        await transporter.verify();
        
        const currentConfig = await readConfig('emailSettings');
        currentConfig.appPassword = appPassword;
        currentConfig.senderEmail = senderEmail;
        await writeConfig('emailSettings', currentConfig);

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: 'Verification failed. Please check credentials.' });
    }
});

// Serve favicon to prevent 404s during development/production
const faviconPath = path.join(__dirname, 'public', 'uploads', 'hero', 'hero-logo.png');
app.get('/favicon.ico', (req, res) => {
    res.sendFile(faviconPath, err => {
        if (err) {
            res.status(404).end();
        }
    });
});

// Serve static assets after API routes are registered
app.use(express.static(path.join(__dirname, 'public')));

// A catch-all to redirect any direct navigation to the homepage
app.get('*', (req, res) => {
  if (path.extname(req.url)) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
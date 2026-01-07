const express = require('express');
const cors = require('cors');
const path = require('path');
const Multer = require('multer');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const gcsSetting = require('./gcsBucket.js');
const gcsServices = require('./gcsServices.js');
const User = require('./models/User');

const app = express();
const port = 8080;
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Multer
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


// Routes and controllers 
app.post('/api/google-images/users/register', async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete
app.delete('/api/google-images/delete', multer.none(), async (req, res) => {
  try {
    const { filename, email } = req.body;

    console.log('Delete request received:', { filename, email });

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required',
      });
    }

    const result = await gcsServices.deleteFile(filename, email);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      ...result,
    });
  } catch (error) {
    console.error('Delete error:', error.message);
    
    if (error.message.includes('Permission denied')) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'File not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting file: ' + error.message,
    });
  }
});

//Get user files
app.get('/api/google-images/user/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    console.log('Getting files for user with email:', email);
    
    const files = await gcsServices.getUserFiles(email);

    res.send([files]);
  } catch (error) {
    console.error('Get user files error:', error.message);
    
    if (error.message === 'User folder not found') {
      return res.send([[]]);
    }

    res.status(500).json({
      success: false,
      message: 'Error retrieving files: ' + error.message,
    });
  }
});

// Get all files
app.get('/api/google-images/images', async (req, res) => {
  try {
    const files = await gcsServices.getAllFiles();
    res.send([files]);
  } catch (error) {
    console.error('Get all files error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error retrieving files: ' + error.message,
    });
  }
});

app.get('/api/google-images/image/:imgname/:email', async(req,res)=>{
  const filename = decodeURIComponent(req.params.imgname);
  const email = decodeURIComponent(req.params.email);

  // const {filename} = req.body;
  console.log(filename,email);
  try{
    const files = await gcsServices.getFile(filename,email);
    res.send([files]);
  }catch (error) {
    console.error('Get certain files error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error retrieving certain file: ' + error.message,
    });
  }
})

// upload file
app.post('/api/google-images/upload', multer.single('imgfile'), async (req, res) => {
  try {
    if (!req.file || !req.body.email) {
      return res.status(400).json({
        success: false,
        message: 'Missing file or email',
      });
    }

    const email = req.body.email;
    console.log('Upload request from user:', email, 'file:', req.file.originalname);
    
    const result = await gcsServices.uploadFile(req.file, email);

    console.log('Upload successful:', result.folder);

    res.status(200).json({
      ...result,
      message: result.private ? 'Upload successful (private)' : 'Upload successful',
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message,
    });
  }
});

// Get all users
app.get('/api/google-images/users', async (req, res) => {
  try {
    const users = await gcsServices.getAllUsers();
    
    res.json({
      users: users,
      iamEnabled: gcsSetting.CONFIG.enableIAM,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/google-images', (req, res) => {
  res.send('server is running at /api/google-images');
});

app.get('/', (req, res) => {
  res.send('working api at /');
});

// Server startup
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gcs-storage');
    console.log('Connected to MongoDB');

    await gcsSetting.initialize();

    app.listen(port, () => {
      console.log('='.repeat(50));
      console.log(`Server running on http://localhost:${port}`);
      console.log(`IAM Status: ${gcsSetting.CONFIG.enableIAM ? 'ENABLED' : 'DISABLED'}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
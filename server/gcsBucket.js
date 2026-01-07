const { Storage } = require('@google-cloud/storage');
const { IamClient } = require('@google-cloud/iam').v2;
const dotenv = require('dotenv');
const User = require('./models/User'); // ADDED: Import User model

dotenv.config();

// Config

const CONFIG = {
  projectId: process.env.PROJECT_ID,
  keyFilename: process.env.KEY_FILE_NAME,
  bucketName: process.env.BUCKET_NAME,
  enableIAM: process.env.ENABLE_IAM == "enable",
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  
};

// Initialize clients
const storage = new Storage({
  projectId: CONFIG.projectId,
  keyFilename: CONFIG.keyFilename,
});
const bucket = storage.bucket(CONFIG.bucketName);


async function initialize() {
  await seedInitialUsers();
  
  if (!CONFIG.enableIAM) {
    console.log('IAM disabled, skipping IAM setup');
    return;
  }

  try {
    await setupCustomRoles();
    await setupAdminPolicy();
    
  } catch (error) {
    console.error('Initialization failed:', error.message);
  }
}


async function seedInitialUsers() {
  const userCount = await User.countDocuments();
  // 
  if (userCount === 0) {
    console.log('Seeding initial users...');
    const initialUsers = [
      { firstName: 'Mosckovic',lastName:"Bob", email: 'mosckovic1@example.com', storageFolder: 'user1_folder'},
      { firstName: 'Berzinskiy',lastName:"Chris", email: 'berzinskiy@example.com', storageFolder: 'user2_folder'},
    ];
    
    for (const userData of initialUsers) {
      try {
        await User.create(userData);
        // Create the folder
        await bucket.file(`${userData.storageFolder}/.keep`).save('');
         console.log(`Created user: ${userData.firstName} ${userData.lastName}`);
      } catch (error) {
        console.log(`User ${userData.username} might already exist:`, error.message);
      }
    }
  }
  // 
}


async function setupCustomRoles() {
  const iamClient = new IamClient();
  const parent = `projects/${CONFIG.projectId}`;

  const roles = [
    {
      id: 'storageAdmin',
      title: 'Storage Admin',
      description: 'Full access to all storage objects',
      permissions: [
        'storage.objects.create',
        'storage.objects.delete',
        'storage.objects.get',
        'storage.objects.list',
        'storage.objects.update',
        'storage.buckets.get',
      ],
    },
    {
      id: 'storageFolderOwner',
      title: 'Storage Folder Owner',
      description: 'Full control within assigned folder',
      permissions: [
        'storage.objects.create',
        'storage.objects.delete',
        'storage.objects.get',
        'storage.objects.list',
        'storage.objects.update',
      ],
    },
    {
      id: 'storageFolderViewer',
      title: 'Storage Folder Viewer',
      description: 'Read-only access to storage',
      permissions: [
        'storage.objects.get',
        'storage.objects.list',
      ],
    },
  ];

  for (const role of roles) {
    await createRoleIfNeeded(role, parent, iamClient);
  }
}

async function createRoleIfNeeded(roleConfig, parent, iamClient) {
  const rolePath = `${parent}/roles/${roleConfig.id}`;

  try {
    await iamClient.getRole({ name: rolePath });
  } catch (error) {
    if (error.code === 404) {
      await iamClient.createRole({
        parent,
        roleId: roleConfig.id,
        role: {
          title: roleConfig.title,
          description: roleConfig.description,
          includedPermissions: roleConfig.permissions,
          stage: 'GA',
        },
      });
    }
  }
}


async function setupAdminPolicy() {
  const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
  policy.version = 3;
  policy.bindings = policy.bindings || [];

  const adminMember = `user:${CONFIG.adminEmail}`;
  const adminRole = `projects/${CONFIG.projectId}/roles/storageAdmin`;

  const exists = policy.bindings.some(
    b => b.role === adminRole && b.members.includes(adminMember) && !b.condition
  );

  if (!exists) {
    policy.bindings.push({
      role: adminRole,
      members: [adminMember],
    });
    await bucket.iam.setPolicy(policy);
  }
}

module.exports = {
  CONFIG,
  initialize,
  bucket
  };
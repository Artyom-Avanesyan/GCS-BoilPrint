const dotenv = require('dotenv');
const User = require('./models/User.js');
const { bucket, CONFIG } = require('./gcsBucket.js');
dotenv.config();

async function createUserFolder(email) {
  
  const sanitizedEmail = email.replace('@', '_at_').replace(/\./g, '_');
  const folderName = `${sanitizedEmail}_folder`;
  const fileName = `${folderName}/.keep`;

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new Error(`User with email ${email} does not exist. Please register first.`);
    }

    // Check if folder exists
    const [exists] = await bucket.file(fileName).exists();
    if (exists) {
      console.log(`Folder already exists for ${email}: ${folderName}`);
      return folderName;
    }

    await bucket.file(fileName).save('');
    
    // Update database
    await User.findOneAndUpdate(
      { email },
      { 
        storageFolder: folderName,
        folderCreated: true
      }
    );

    if (CONFIG.enableIAM) {
      await addUserPolicy(email, folderName);
      await User.findOneAndUpdate(
        { email },
        { iamPolicyApplied: true }
      );
    }

    console.log(`Created folder for ${email}: ${folderName}`);
    return folderName;
  } catch (error) {
    console.error(`Error creating folder for ${email}:`, error.message);
    throw error;
  }
}

// addUserPolicy 
async function addUserPolicy(email, folderName) {
  const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });
  policy.version = 3;
  policy.bindings = policy.bindings || [];

  const member = `user:${email}`;
  const ownerRole = `projects/${CONFIG.projectId}/roles/storageFolderOwner`;
  const viewerRole = `projects/${CONFIG.projectId}/roles/storageFolderViewer`;

  const ownerExists = policy.bindings.some(
    b => b.condition?.title === `FolderOwner_${folderName}`
  );

  if (!ownerExists) {
    policy.bindings.push({
      role: ownerRole,
      members: [member],
      condition: {
        title: `FolderOwner_${folderName}`,
        description: `Full access to ${folderName}/ only`,
        expression: `resource.name.startsWith("projects/_/buckets/${CONFIG.bucketName}/objects/${folderName}/")`,
      },
    });
  }

  const viewerExists = policy.bindings.some(
    b => b.role === viewerRole && b.members?.includes(member) && !b.condition
  );

  if (!viewerExists) {
    policy.bindings.push({
      role: viewerRole,
      members: [member],
    });
  }

  await bucket.iam.setPolicy(policy);
}


async function uploadFile(file, email) {
  // Find user by email
  let user = await User.findOne({ email });
  
  if (!user) {
    throw new Error(`User with email ${email} not found. Please register first.`);
  }

  let userFolder = user.storageFolder;

  if (!userFolder || !user.folderCreated) {
    userFolder = await createUserFolder(email);
  }

  const fileName = `${userFolder}/${file.originalname}`;
  const blob = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        uploadedBy: `${user.firstName} ${user.lastName}`,
        uploadedByEmail: email,
        uploadDate: new Date().toISOString(),
      },
      resumable: false,
    });

    blobStream.on('error', reject);
    //uploading image with required values due resolve({object})
    blobStream.on('finish', async () => {
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve({
          success: true,
          url: publicUrl,
          folder: userFolder,
          fileName: fileName,
          uploadedBy: `${user.firstName} ${user.lastName}`
        });
      } catch {
        resolve({
          success: true,
          folder: userFolder,
          fileName: fileName,
          uploadedBy: `${user.firstName} ${user.lastName}`,
          private: true,
        });
      }
    });

    blobStream.end(file.buffer);
  });
}

async function deleteFile(filename, email) {
  console.log(`Delete request: filename="${filename}", email="${email}"`);
  
  // Admin check
  if (email && email !== CONFIG.adminEmail) {
    const user = await User.findOne({ email });
    const userFolder = user?.storageFolder;
    const fileFolderName = filename.split('/')[0];

    console.log(`Checking permissions: userFolder="${userFolder}", fileFolderName="${fileFolderName}"`);

    if (userFolder && fileFolderName && userFolder !== fileFolderName) {
      throw new Error('Permission denied: Cannot delete from another user\'s folder');
    }
  }

  const file = bucket.file(filename);
  const [exists] = await file.exists();

  if (!exists) {
    throw new Error('File not found');
  }

  await file.delete();
  console.log(`Successfully deleted: ${filename}`);
  return { success: true, deletedFile: filename };
}

async function getUserFiles(email) {
  const user = await User.findOne({ email });
  const userFolder = user?.storageFolder;

  if (!userFolder) {
    console.log(`No folder found for ${email}, returning empty array`);
    return [];
  }

  console.log(`Loading files for ${user.firstName} ${user.lastName} from folder: ${userFolder}`);
  const [files] = await bucket.getFiles({ prefix: `${userFolder}/` });
  return files.filter(f => !f.name.endsWith('/.keep'));
}

async function getAllFiles() {
  const [files] = await bucket.getFiles();
  return files.filter(f => !f.name.endsWith('/.keep'));
}
///
async function getFile(filename,email){
  const user = await User.findOne({ email });
  const userFolder = user?.storageFolder;
      if (!userFolder) {
        console.log(`No folder found for ${email}, returning empty array for getFile function`);
        return [];
      }

    const [files] = await bucket.getFiles({ prefix: `${userFolder}/` })

  const allFiles = files.filter(f => !f.name.endsWith('/.keep'));


 return allFiles.filter(file => {
         const takenfileName = file.name.split('/').pop();

 return takenfileName == filename
});


}
/////

async function getAllUsers() {
  const users = await User.find({});
  console.log('Total users found:', users.length); // Add this
  console.log('Raw users:', users); // Add this
  return users.map(user => ({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`,
    storageFolder: user.storageFolder,
    iamPolicyApplied: user.iamPolicyApplied
  }));
}

module.exports = {
  uploadFile,
  deleteFile,
  getUserFiles,
  getAllFiles,
  getAllUsers,
  getFile,
  createUserFolder
};
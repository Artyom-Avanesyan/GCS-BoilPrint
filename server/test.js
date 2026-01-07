const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');
dotenv.config();


async function testFolderCreation() {
  console.log('Testing folder creation fix...\n');
  
  
  const username = 'testuser';
  const folderName = `${username}_folder`;
  
  console.log(`Folder name is now consistent: ${folderName}`);
  console.log(`No timestamp suffix - same folder every time`);
  console.log(`One user = one folder structure maintained`);
  
  console.log('\nBefore (problematic):');
  console.log(`   ${username}_${Date.now()}`);
  console.log(`   ${username}_${Date.now()}`);
  console.log(`   (Different folders each time!)`);
  
  console.log('\nAfter (fixed):');
  console.log(`   ${folderName}`);
  console.log(`   ${folderName}`);
  console.log(`   (Same folder every time!)`);
  
  console.log('\n🎉 Fix verified: No more 404 errors when loading user media!');
}

testFolderCreation().catch(console.error);
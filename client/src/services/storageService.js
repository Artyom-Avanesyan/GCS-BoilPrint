const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function uuidv4() {
  return Math.random().toString(36).substring(2, 9);
}

export async function uploadFile(file, email) {
  const postid = uuidv4();
  const fileExtension = file.name.split('.').pop();
  const blob = file.slice(0, file.size, file.type);
  const sanitizedEmail = email.replace('@', '_at_').replace(/\./g, '_');
  const newFile = new File(
    [blob], 
    `${postid}_${sanitizedEmail}_post.${fileExtension}`, 
    { type: file.type }
  );

  
  const formData = new FormData();
  formData.append('email', email);
  formData.append('imgfile', newFile);
  
  const response = await fetch(`${API_BASE_URL}/api/google-images/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Upload failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function deleteFile(filePath, email) {
  const formData = new FormData();
  formData.append('filename', filePath);
  formData.append('email', email);
  
  const response = await fetch(`${API_BASE_URL}/api/google-images/delete`, {
    method: 'DELETE',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function loadUserFiles(email) {
  const response = await fetch(`${API_BASE_URL}/api/google-images/user/${encodeURIComponent(email)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to load user files: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data[0] || [];
}

export async function loadAllFiles() {
  const response = await fetch(`${API_BASE_URL}/api/google-images/images`);
  
  if (!response.ok) {
    throw new Error(`Failed to load files: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data[0] || [];
}

export async function getAllUsers() {
  const response = await fetch(`${API_BASE_URL}/api/google-images/users`);
  
  if (!response.ok) {
    throw new Error(`Failed to load users: ${response.statusText}`);
  }
  
  return response.json();
}

export async function registerUser(firstName, lastName, email) {
  const response = await fetch(`${API_BASE_URL}/api/google-images/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ firstName, lastName, email }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Registration failed: ${response.statusText}`);
  }
  
  return response.json();
}
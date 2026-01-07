import { useState, useEffect } from 'react';
import { uploadFile, getAllUsers, registerUser } from '../services/storageService';

function UploadSection({ 
  onUploadSuccess, 
  onLoadUserFiles, 
  onLoadAllFiles, 
  statusMessage, 
  setStatusMessage 
}) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  };

  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
        if (!selectedUser) {
          setStatusMessage({ text: 'Please select a user', type: 'error' });
          return;
        }
        
           if (!selectedFile) {
             setStatusMessage({ text: 'Please select a file', type: 'error' });
             return;
           }

    setUploading(true);
    setStatusMessage({ text: 'Uploading file...', type: 'info' });

    try {
      const result = await uploadFile(selectedFile, selectedUser);
      
      if (result.success) {
        onUploadSuccess(selectedUser, result.folder);
        setSelectedFile(null);
        document.getElementById('imgfile').value = '';
      } else {
        setStatusMessage({ text: 'Upload failed', type: 'error' });
      }
    } catch (error) {
      setStatusMessage({ text: `Upload error: ${error.message}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
      const result = await registerUser(
        newUser.firstName,
        newUser.lastName,
        newUser.email
      );
      
      if (result.success) {
        setStatusMessage({ 
          text: `User ${result.user.fullName} registered successfully`, 
          type: 'success' 
        });
        setShowRegisterForm(false);
        setNewUser({ firstName: '', lastName: '', email: '' });
        await loadUsers(); // Reload users
      }
    } catch (error) {
      setStatusMessage({ 
        text: `Registration failed: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const getUserDisplayName = () => {
    const user = users.find(u => u.email === selectedUser);
    return user ? `${user.fullName} (${user.email})` : selectedUser;
  };

  const getUserFolder = () => {
    const user = users.find(u => u.email === selectedUser);
    return user?.storageFolder || 'No folder yet';
  };

  return (
    <div className="upload-section">
      {!showRegisterForm ? (
        <>
          <div className="form-group">
            <label htmlFor="userSelect">Select User:</label>
            <select 
              id="userSelect" 
              value={selectedUser} 
              onChange={handleUserChange}
              required
            >
              <option value="">-- Select User --</option>
              {users.map(user => (
                <option key={user.email} value={user.email}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
            <button 
              className="btn-secondary"
              onClick={() => setShowRegisterForm(true)}
              style={{ marginLeft: '10px' }}
            >
              Register New User
            </button>
          </div>
          
          {selectedUser && (
            <div className="user-info">
              <strong>Current User:</strong> {getUserDisplayName()}<br />
              <strong>Upload Folder:</strong> {getUserFolder()}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="imgfile">Choose Image:</label>
            <input 
              type="file" 
              id="imgfile"
              accept="image/jpeg,image/png,image/gif" 
              onChange={handleFileChange}
            />
          </div>
          
          <button 
            className="btn-primary"
            onClick={handleUpload}
            disabled={!selectedUser || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          
          <button 
            className="btn-secondary"
            onClick={() => onLoadUserFiles(selectedUser)}
            disabled={!selectedUser}
            style={{ marginLeft: '10px' }}
          >
            Load My Files
          </button>
          
          <button 
            className="btn-danger"
            onClick={onLoadAllFiles}
            style={{ marginLeft: '10px' }}
          >
            Load All Files
          </button>
        </>
      ) : (
        <form onSubmit={handleRegister} className="register-form">
          <h3>Register New User</h3>
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={newUser.firstName}
              onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={newUser.lastName}
              onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            Register
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => setShowRegisterForm(false)}
            style={{ marginLeft: '10px' }}
          >
            Cancel
          </button>
        </form>
      )}
      
      {statusMessage.text && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
    </div>
  );
}

export default UploadSection;
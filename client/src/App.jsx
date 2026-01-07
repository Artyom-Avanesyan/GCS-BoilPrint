// src/App.jsx - Minor update
import { useState, useEffect } from 'react';
import './App.css';
import UploadSection from './components/UploadSection';
import ImageGallery from './components/ImageGallery';
import { loadAllFiles, loadUserFiles } from './services/storageService';

function App() {
  //  States
  const [images, setImages] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleLoadAllFiles();
  }, []);

  //Handlers for image operations
  const handleLoadAllFiles = async () => {
    setLoading(true);
    setStatusMessage({ text: 'Loading all files...', type: 'info' });
    
    try {
      const files = await loadAllFiles();
      setImages(files);
      setCurrentUserEmail('all');
      setStatusMessage({ 
        text: `Loaded ${files.length} total files`, 
        type: 'success' 
      });
    } catch (error) {
      setStatusMessage({ 
        text: `Error loading files: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadUserFiles = async (email) => {
    setLoading(true);
    setStatusMessage({ text: `Loading files for user...`, type: 'info' });
    
    try {
      const files = await loadUserFiles(email);
      setImages(files);
      setCurrentUserEmail(email);
      setStatusMessage({ 
        text: `Loaded ${files.length} files for user`, 
        type: 'success' 
      });
    } catch (error) {
      setStatusMessage({ 
        text: `Error loading user files: ${error.message}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (email, folder) => {
    setStatusMessage({ 
      text: `Upload successful! File uploaded to ${folder}`, 
      type: 'success' 
    });
    if (email) {
      handleLoadUserFiles(email);
    }
  };

  const handleDeleteSuccess = () => {
    setStatusMessage({ text: 'File deleted successfully', type: 'success' });
    if (currentUserEmail && currentUserEmail !== 'all') {
      handleLoadUserFiles(currentUserEmail);
    } else {
      handleLoadAllFiles();
    }
  };

  return (
    <div className="app-container">
      <h2>Google Storage API - User Based Upload System</h2>
      
      <UploadSection
        onUploadSuccess={handleUploadSuccess}
        onLoadUserFiles={handleLoadUserFiles}
        onLoadAllFiles={handleLoadAllFiles}
        statusMessage={statusMessage}
        setStatusMessage={setStatusMessage}
      />
      
      <h3>Uploaded Images</h3>
      <ImageGallery 
        images={images}
        currentUserEmail={currentUserEmail}
        onDeleteSuccess={handleDeleteSuccess}
        setStatusMessage={setStatusMessage}
        loading={loading}
      />
    </div>
  );
}

export default App;
import { deleteFile } from '../services/storageService';

function ImageGallery({ images, currentUserEmail, onDeleteSuccess, setStatusMessage, loading }) {
  const bucketName = import.meta.env.VITE_BUCKET_NAME || 'test-bucket-thats-my';
  
  const handleDelete = async (filePath) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const result = await deleteFile(filePath, currentUserEmail);
      
      if (result.success) {
        onDeleteSuccess();
      } else {
        setStatusMessage({ 
          text: result.message || 'Delete failed', 
          type: 'error' 
        });
      }
    } catch (error) {
      setStatusMessage({ 
        text: `Delete error: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'no size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!images || images.length === 0) {
    return (
      <div id="images">
        <p>No images found</p>
      </div>
    );
  }

  return (
    <div id="images">
      {images.map((file) => {
        const actualPath = file.name;
        const pathParts = actualPath.split('/');
        const folderName = pathParts.length > 1 ? pathParts[0] : 'root';
        const fileName = pathParts[pathParts.length - 1];
        
        return (
          <div key={actualPath} className="image-container">
            <img 
              src={`https://storage.googleapis.com/${bucketName}/${actualPath}`}
              alt={fileName}
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='200'%3E%3Crect width='250' height='200' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3EImage not found%3C/text%3E%3C/svg%3E";
              }}
            />
            <div className="image-info">
              <div className="folder-name">📁 {folderName}</div>
              <div style={{ fontSize: '11px', marginTop: '5px' }}>{fileName}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '3px' }}>
                Path: {actualPath}
              </div>
              <div style={{ fontSize: '10px', color: '#da1111ff', marginTop: '3px' }}>
                {file.size ? `Size: ${formatFileSize(file.size)}` : 'no size'}
              </div>
            </div>
            <button 
              className="btn-delete"
              onClick={() => handleDelete(actualPath)}
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ImageGallery;
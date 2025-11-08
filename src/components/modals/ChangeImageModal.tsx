import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';

interface ChangeImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: string) => void;
  imageList?: Array<{ label: string; value: string }>;
}

const ChangeImageModal: React.FC<ChangeImageModalProps> = ({ isOpen, onClose, onSelect, imageList = [] }) => {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handleSelect = (image: string) => {
    setSelectedImage(image);
    onSelect(image);
    onClose();
  };

  const handleUrlSelect = () => {
    if (customUrl.trim()) {
      handleSelect(customUrl);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedImage(dataUrl);
        setSelectedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSelect = () => {
    if (uploadedImage) {
      handleSelect(uploadedImage);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>Select Image for Group</ModalHeader>
      <ModalBody>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'library' })}
              onClick={() => setActiveTab('library')}
              style={{ cursor: 'pointer' }}
            >
              Library
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'url' })}
              onClick={() => setActiveTab('url')}
              style={{ cursor: 'pointer' }}
            >
              URL
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'upload' })}
              onClick={() => setActiveTab('upload')}
              style={{ cursor: 'pointer' }}
            >
              Upload
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab} style={{ marginTop: '20px' }}>
          {/* Library Tab */}
          <TabPane tabId="library">
            {imageList.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                {imageList.map((image) => (
                  <button
                    key={image.value}
                    style={{
                      padding: '10px',
                      border: selectedImage === image.value ? '2px solid blue' : '1px solid #ccc',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    onClick={() => handleSelect(image.value)}
                  >
                    <img
                      src={image.value.startsWith('http') ? image.value : `/./../images/${image.value}`}
                      alt={image.label}
                      style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '11px', textAlign: 'center', wordBreak: 'break-word' }}>
                      {image.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No images available in library
              </div>
            )}
          </TabPane>

          {/* URL Tab */}
          <TabPane tabId="url">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="Enter image URL (http:// or https://)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  style={{ 
                    padding: '10px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {customUrl && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div>
                    <img
                      src={customUrl}
                      alt="Preview"
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'contain',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '5px'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <button
                    onClick={handleUrlSelect}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Select This URL
                  </button>
                </div>
              )}
            </div>
          </TabPane>

          {/* Upload Tab */}
          <TabPane tabId="upload">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>
                  Upload Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ 
                    padding: '10px', 
                    borderRadius: '4px', 
                    border: '1px solid #ccc',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {uploadedImage && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div>
                    <img
                      src={uploadedImage}
                      alt="Uploaded Preview"
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'contain',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '5px'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleUploadSelect}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Select This Image
                  </button>
                </div>
              )}
            </div>
          </TabPane>
        </TabContent>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ChangeImageModal;

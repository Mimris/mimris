import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';
import styles from './ChangeImageModal.module.css';

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
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const resolveImageSrc = (value: string): string => {
    if (!value) return '';
    if (value.startsWith('http') || value.startsWith('https')) return value;
    if (value.startsWith('data:')) return value;
    if (value.startsWith('/')) return value;
    return `/images/${value.replace(/^\//, '')}`;
  };

  const tooltipStyles = (isVisible: boolean): React.CSSProperties => ({
    position: 'absolute',
    bottom: '-52px',
    left: '50%',
    transform: isVisible
      ? 'translateX(-50%) translateY(0)'
      : 'translateX(-50%) translateY(8px)',
    opacity: isVisible ? 1 : 0,
    pointerEvents: 'none',
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    background: 'rgba(0, 0, 0, 0.85)',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    zIndex: 10,
    minWidth: '140px',
    textAlign: 'center',
  });

  const tooltipArrowStyles = (isVisible: boolean): React.CSSProperties => ({
    position: 'absolute',
    top: '-6px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: '12px',
    height: '12px',
    background: 'rgba(0, 0, 0, 0.85)',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.15s ease',
  });

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
  <Modal isOpen={isOpen} toggle={onClose} className={styles.modal}>
  <ModalHeader toggle={onClose} className={styles.header}>Set Image for Container (Group)</ModalHeader>
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

  <TabContent activeTab={activeTab} style={{ background: 'white', marginTop: '0px', padding: '4px' }}>
          {/* Library Tab */}
          <TabPane tabId="library">
            {imageList.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(74px, 1fr))',
                  gap: '6px',
                  justifyItems: 'stretch',
                }}
              >
                {imageList.map((image) => {
                  const imageSrc = resolveImageSrc(image.value);

                  return (
                  <button
                    key={image.value}
                    style={{
                      padding: '4px',
                      border: selectedImage === image.value ? '2px solid #1f6feb' : '1px solid #d0d7de',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      position: 'relative',
                      overflow: 'hidden',
                      width: '100%',
                    }}
                    onClick={() => handleSelect(image.value)}
                    onMouseEnter={() => setHoveredImage(image.value)}
                    onMouseLeave={() => setHoveredImage(null)}
                  >
                    <img
                      src={imageSrc}
                      alt={image.label}
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span style={{ fontSize: '10px', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.15 }}>
                      {image.label}
                    </span>
                    <div style={tooltipStyles(hoveredImage === image.value)}>
                      <div style={tooltipArrowStyles(hoveredImage === image.value)} />
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{image.label}</div>
                      <div style={{ fontSize: '11px', opacity: 0.85 }}>Click to apply to this group</div>
                    </div>
                  </button>
                );
              })}
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
        <Button color="secondary" onClick={onClose} size="sm" className={styles.closeButton}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ChangeImageModal;

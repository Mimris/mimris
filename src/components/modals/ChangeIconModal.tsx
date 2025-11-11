import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';

interface ChangeIconModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
}

// Unicode characters collection - organized by category
const UNICODE_CHARS = [
  // Checkmarks & Basic Symbols
  '✓', '✗', '✔', '✘', '★', '☆', '♦', '♠', '♣', '♥',
  
  // Arrows
  '→', '←', '↑', '↓', '⇒', '⇐', '⇑', '⇓', '⟹', '⟸',
  '↗', '↖', '↙', '↘', '⬅', '⬆', '⬇', '⬉', '⬈',
  
  // Shapes & Geometry
  '◆', '▲', '▼', '◀', '▶', '■', '□', '●', '○', '◐',
  '◑', '◓', '◒', '◔', '⊕', '⊖', '⊘', '⊙', '⊚', '⊛',
  '⊜', '⊝', '☐', '☑', '☒', '☓',
  
  // Miscellaneous Symbols
  '✛', '✜',  '✢', '✣', '✤', '✥',
  '✦', '✧', '✨', '✩', '✪', '✫', '✬', '✭', '✮', '✯',
  '✰', '✱', '✲', '✳', '✴', '❀', '❁', '❂', '❃', '❄',
  '❅', '❆', '❇', '❈', '❉', '❊', '❋', '❌', '❍', '❎',
  
  // Dingbats
  '✉', '✊', '✋', '✌', '✍', '✎', '✏', '✐', '✑', '✒',
  '☞', '☝', '☜', '☚', '☟', '☛', '☙', '♫', '♬', '♪',
  
  // Activities & Objects
  '⌛', '⌚', '⏰', '⏱', '⏲', '◉', '☺', '☹', '☻', '⚽',
  '⚾', '🎯', '🎲', '🎰', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧',
  
  // Transport & Places
  '✈', '⛵', '🚗', '🚕', '🚙', '🚌', '🚎', '🚐', '🚑', '🚒',
  '🚓', '🚔', '🚖', '🚘', '🚍', '🚞', '🚋', '🚝', '🚄',
  
  // Gender & Life Symbols
  '♀', '♂', '⚢', '⚣', '⚤', '⚥', '⚦', '⚧', '⚨', '⚩',
  '⚪', '⚫', '⚬', '⚭', '⚮', '⚯', '⚰', '⚱', '⚲', '⚳',
  '⚴', '⚵', '⚶', '⚷', '⚸', '⚹', '⚺', '⚻', '⚼',
  
  // Emoticons
  '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉',
  '😊', '😋', '😌', '😍', '😎', '😏', '😐', '😑', '😒', '😓',
  '😔', '😕', '😖', '😗', '😘', '😙', '😚', '😛', '😜', '😝',
];

// Library icons - common icon names
const LIBRARY_ICONS = [
  { label: 'Object', value: 'https://img.icons8.com/color/2x/object.png' },
  { label: 'Services', value: 'https://img.icons8.com/clouds/2x/services.png' },
  { label: 'Important Property', value: 'https://img.icons8.com/color/2x/important-property.png' },
  { label: 'Urgent Property', value: 'https://img.icons8.com/color/2x/urgent-property.png' },
  { label: 'Info', value: 'https://img.icons8.com/color/2x/information.png' },
  { label: 'Role', value: 'https://img.icons8.com/color/2x/admin-settings-male.png' },
  { label: 'Task', value: 'https://img.icons8.com/color/2x/task.png' },
  { label: 'View', value: 'https://img.icons8.com/color/2x/view-file.png' },
  { label: 'Event', value: 'https://img.icons8.com/cotton/72/tear-off-calendar.png' },
  { label: 'Rule', value: 'https://img.icons8.com/color/2x/rules-book.png' },
  { label: 'Decision', value: 'https://img.icons8.com/color/2x/approve.png' },
  { label: 'Unit Type', value: 'https://img.icons8.com/color/2x/energy-meter.png' },
  { label: 'Data Type', value: 'https://img.icons8.com/color/2x/data-.png' },
  { label: 'Data Value', value: 'https://img.icons8.com/color/2x/variable.png' },
  { label: 'Person', value: 'https://img.icons8.com/color/2x/person-male.png' },
  { label: 'Search', value: 'https://img.icons8.com/color/search' },
  { label: 'Property', value: 'property.png' },
  { label: 'Organisation 1', value: 'Organisation1.png' },
  { label: 'Organisation 2', value: 'Organisation2.png' },
  { label: 'Book', value: 'book.png' },
  { label: 'Car', value: 'car.png' },
  { label: 'Default', value: 'default.png' },
  { label: 'Exclusive', value: 'exclusive.png' },
  { label: 'Inclusive', value: 'inclusive.png' },
];

// GoJS shapes/figures
const GOJS_SHAPES = [
  { label: 'Rectangle', value: 'Rectangle' },
  { label: 'Square', value: 'Square' },
  { label: 'RoundedRectangle', value: 'RoundedRectangle' },
  { label: 'Border', value: 'Border' },
  { label: 'Ellipse', value: 'Ellipse' },
  { label: 'Circle', value: 'Circle' },
  { label: 'Triangle', value: 'Triangle' },
  { label: 'TriangleDown', value: 'TriangleDown' },
  { label: 'TriangleLeft', value: 'TriangleLeft' },
  { label: 'TriangleRight', value: 'TriangleRight' },
  { label: 'Diamond', value: 'Diamond' },
  { label: 'Pentagon', value: 'Pentagon' },
  { label: 'Hexagon', value: 'Hexagon' },
  { label: 'Cylinder', value: 'Cylinder' },
  { label: 'Parallelogram1', value: 'Parallelogram1' },
  { label: 'Parallelogram2', value: 'Parallelogram2' },
  { label: 'Cloud', value: 'Cloud' },
  { label: 'Procedure', value: 'Procedure' },
  { label: 'Lightbulb', value: 'Lightbulb' },
  { label: 'Pie', value: 'Pie' },
];

const ChangeIconModal: React.FC<ChangeIconModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');

  const handleSelect = (icon: string) => {
    // Convert direct Unicode to escape sequence for storage
    // Regular Unicode: ★ → \u2605 (4 digits)
    // Emoji/extended: 😀 → \ud83dde00 (surrogate pair) or \U0001f600 (8 digits)
    let storageValue = icon;
    
    if (icon.charCodeAt(0) > 127) {
      const codePoint = icon.codePointAt(0);
      if (codePoint) {
        if (codePoint <= 0xFFFF) {
          // Regular Unicode character (4 hex digits)
          storageValue = `\\u${codePoint.toString(16).padStart(4, '0')}`;
        } else {
          // Extended Unicode/Emoji (8 hex digits with U prefix for clarity)
          storageValue = `\\U${codePoint.toString(16).padStart(8, '0')}`;
        }
      }
    }
    
    onSelect(storageValue);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>Select Icon</ModalHeader>
      <ModalBody>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'library' })}
              onClick={() => setActiveTab('library')}
              style={{ cursor: 'pointer' }}
            >
              Library Icons
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'shapes' })}
              onClick={() => setActiveTab('shapes')}
              style={{ cursor: 'pointer' }}
            >
              Shapes
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
              className={classnames({ active: activeTab === 'unicode' })}
              onClick={() => setActiveTab('unicode')}
              style={{ cursor: 'pointer' }}
            >
              Unicode
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === 'svg' })}
              onClick={() => setActiveTab('svg')}
              style={{ cursor: 'pointer' }}
            >
              SVG
            </NavLink>
          </NavItem>
        </Nav>

        <TabContent activeTab={activeTab} style={{ marginTop: '20px' }}>
          {/* Library Icons Tab */}
          <TabPane tabId="library">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {LIBRARY_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  style={{
                    padding: '10px',
                    border: selectedIcon === icon.value ? '2px solid blue' : '1px solid #ccc',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                  onClick={() => {
                    setSelectedIcon(icon.value);
                    handleSelect(icon.value);
                  }}
                >
                  <img
                    src={icon.value.startsWith('http') ? icon.value : `/./../images/${icon.value}`}
                    alt={icon.label}
                    style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: '11px', textAlign: 'center' }}>{icon.label}</span>
                </button>
              ))}
            </div>
          </TabPane>

          {/* Shapes Tab */}
          <TabPane tabId="shapes">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {GOJS_SHAPES.map((shape) => (
                <button
                  key={shape.value}
                  style={{
                    padding: '10px',
                    border: selectedIcon === shape.value ? '2px solid blue' : '1px solid #ccc',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                  onClick={() => {
                    setSelectedIcon(shape.value);
                    handleSelect(shape.value);
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#3498db',
                      borderRadius: shape.value.includes('Circle') ? '50%' : '4px',
                    }}
                  />
                  <span style={{ fontSize: '11px', textAlign: 'center' }}>{shape.label}</span>
                </button>
              ))}
            </div>
          </TabPane>

          {/* URL Tab */}
          <TabPane tabId="url">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Enter image URL (http:// or https://)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {customUrl && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img
                    src={customUrl}
                    alt="Preview"
                    style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => handleSelect(customUrl)}
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

          {/* Unicode Tab */}
          <TabPane tabId="unicode">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
              {UNICODE_CHARS.map((char, index) => {
                // Get proper code point for emoji and regular Unicode
                const codePoint = char.codePointAt(0) || 0;
                const codePointHex = codePoint.toString(16).toUpperCase();
                
                return (
                  <button
                    key={`unicode-${index}-${codePoint}`}
                    style={{
                      padding: '10px',
                      border: selectedIcon === char ? '2px solid blue' : '1px solid #ccc',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => {
                      setSelectedIcon(char);
                      handleSelect(char);
                    }}
                    title={`Unicode: U+${codePointHex}`}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          </TabPane>

          {/* SVG Tab */}
          <TabPane tabId="svg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px', flexWrap: 'wrap' }}>
                  <label style={{ fontWeight: 'bold', margin: 0, flex: '1 1 100%' }}>
                    https://www.svgrepo.com/ , https://freesvgicons.com/, or any other SVG source.<br />
                    Paste SVG Code (use width="50" height="50" for proper sizing):
                  </label>
                  <button
                    onClick={() => window.open('https://www.blobmaker.app/', '_blank')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                    title="Open Blob Maker - Free SVG shape generator"
                  >
                    🎨 Blob Editor
                  </button>
                  <button
                    onClick={() => window.open('https://editor.method.ac/', '_blank')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                    title="Open Method Draw - Free SVG editor"
                  >
                    ✏️ Method Draw
                  </button>
                  <button
                    onClick={() => window.open('https://www.figma.com/files/recent', '_blank')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                    title="Open Figma - Professional design tool (free account)"
                  >
                    🎯 Figma
                  </button>
                </div>
                <textarea
                  placeholder={`Example:\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="50" height="50">\n  <circle cx="50" cy="50" r="40" fill="blue"/>\n</svg>`}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  style={{
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    height: '150px',
                    width: '100%',
                    resize: 'vertical',
                  }}
                />
              </div>

              {customUrl.trim().startsWith('<svg') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Preview:</div>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        backgroundColor: '#f9f9f9',
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: customUrl }}
                        style={{
                          transform: 'scale(0.5)',
                          transformOrigin: 'center',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      try {
                        // Convert SVG to base64 data URL
                        let svg = customUrl.trim();
                        
                        // Ensure SVG has width and height attributes for proper scaling
                        // If user didn't specify them, add default 50x50
                        if (!svg.match(/\swidth\s*=/i)) {
                          svg = svg.replace(/<svg\s/i, '<svg width="50" ');
                        }
                        if (!svg.match(/\sheight\s*=/i)) {
                          svg = svg.replace(/<svg\s/i, '<svg height="50" ');
                        }
                        
                        const encoded = btoa(unescape(encodeURIComponent(svg)));
                        const dataUrl = `data:image/svg+xml;base64,${encoded}`;
                        handleSelect(dataUrl);
                      } catch (e) {
                        alert('Error processing SVG: ' + e);
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    Select This SVG
                  </button>
                </div>
              )}

              {customUrl.trim() && !customUrl.trim().startsWith('<svg') && (
                <div style={{ color: '#e74c3c', fontSize: '14px' }}>
                  ⚠️ Please enter valid SVG code (starts with &lt;svg)
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

export default ChangeIconModal;

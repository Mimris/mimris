import React, { useState } from 'react';
import { createRelationshipTypeDraft, validateRelationshipTypeDraft } from '../../utils/relationshipTypeEditor';
import styles from './RelationshipTypeEditor.module.css';

export const RELATIONSHIP_TYPE_FORM_ID = 'relationship-type-editor';

export function RelationshipTypeEditor({ type, objectTypes, onApply }: {
  type: any; objectTypes: any[]; onApply: (draft: any) => void;
}) {
  const [draft, setDraft] = useState(() => createRelationshipTypeDraft(type));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [section, setSection] = useState('Definition');
  const update = (key: string, value: string) => {
    setDraft(previous => ({ ...previous, [key]: value }));
    setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
  };
  const field = (key: string, label: string, options?: Array<{ value: string; label: string }>) => {
    const id = `relationship-type-${key}`;
    const shared = {
      id, value: draft[key], className: `form-control${errors[key] ? ' is-invalid' : ''}`,
      'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `${id}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => update(key, event.target.value),
    };
    // Retain unfamiliar legacy appearance values until the user chooses a replacement.
    const choices = options && !options.some(option => option.value === draft[key])
      ? [...options, { value: draft[key], label: draft[key] || 'None' }] : options;
    return <div className="mb-3" key={key}>
      <label className="form-label" htmlFor={id}>{label}</label>
      {choices ? <select {...shared}>{choices.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        : key === 'description' ? <textarea {...shared} rows={3} />
        : <input {...shared} type={key === 'strokewidth' ? 'number' : 'text'} step={key === 'strokewidth' ? 'any' : undefined} />}
      {errors[key] && <div id={`${id}-error`} className="invalid-feedback">{errors[key]}</div>}
    </div>;
  };
  const endpoints = [{ value: '', label: 'Choose an object type' }, ...objectTypes.filter(item => !item.markedAsDeleted).map(item => ({ value: item.id, label: item.name }))];
  const arrows = ['', 'OpenTriangle', 'Standard', 'Triangle', 'Diamond', 'Circle'].map(value => ({ value, label: value || 'None' }));
  return <form id={RELATIONSHIP_TYPE_FORM_ID} noValidate onSubmit={event => {
    event.preventDefault();
    const nextErrors = validateRelationshipTypeDraft(draft, objectTypes);
    if (typeof CSS !== 'undefined' && CSS.supports && !CSS.supports('color', draft.strokecolor)) nextErrors.strokecolor = 'Enter a valid color, such as black or #2563eb.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setSection(Object.keys(nextErrors).some(key => ['name', 'fromobjtypeRef', 'toobjtypeRef', 'cardinalityFrom', 'cardinalityTo'].includes(key)) ? 'Definition' : 'Appearance');
      return;
    }
    onApply(draft);
  }}>
    <div className="d-flex gap-2 mb-3" role="group" aria-label="Relationship editor sections">
      {['Definition', 'Appearance'].map(label => <button key={label} type="button" className={`btn btn-sm ${styles.sectionButton}`} aria-pressed={section === label} onClick={() => setSection(label)}>{label}</button>)}
    </div>
    {Object.keys(errors).length > 0 && <p role="alert" className="text-danger">Correct the highlighted fields before applying changes.</p>}
    {section === 'Definition' ? <>
      {field('name', 'Name')}
      {field('description', 'Description')}
      {field('fromobjtypeRef', 'Source object type', endpoints)}
      {field('toobjtypeRef', 'Target object type', endpoints)}
      {field('cardinalityFrom', 'Source cardinality')}
      {field('cardinalityTo', 'Target cardinality')}
      <p className="text-muted small">Cardinality may be blank, a number, *, or a range such as 0..1 or 1..*. Endpoint changes apply to the type definition; existing model relationships keep their objects.</p>
    </> : <>
      {field('strokecolor', 'Line color')}
      {field('strokewidth', 'Line width')}
      {field('dash', 'Line style', ['None', 'Dashed', 'Dotted'].map(value => ({ value, label: value === 'None' ? 'Solid' : value })))}
      {field('fromArrow', 'Source arrowhead', arrows)}
      {field('toArrow', 'Target arrowhead', arrows)}
      {field('nameFrom', 'Source end label')}
      {field('nameTo', 'Target end label')}
    </>}
  </form>;
}

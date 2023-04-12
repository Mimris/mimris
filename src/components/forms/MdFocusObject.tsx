import React from 'react'

interface MdFocusObjectProps {
  title: string;
  curRelatedObjsRels: any[];
  curmodelview: any;
  curmetamodel: any;
  selectedId: string;
  setSelectedId: (id: string) => void;
  curobject: any;
  objects: any[];
  includedKeys: string[];
  setObjview: (objview: any) => void;
}

const ObjDetailToMarkdown: React.FC<MdFocusObjectProps> = ({
  title,
  curRelatedObjsRels,
  curmodelview,
  curmetamodel,
  selectedId,
  setSelectedId,
  curobject,
  objects,
  includedKeys,
  setObjview,
}: MdFocusObjectProps) => {
  // Initialize the Markdown string with the title
  let markdownString = `## ${title}\n\n`;

  // Iterate over the related objects and build up the Markdown string
  curRelatedObjsRels?.forEach((objrel) => {
    markdownString += `### ${objrel.name}\n\n`;

    // Iterate over the object properties and add them to the Markdown string
    Object.keys(objrel).forEach((pv) => {
      if (includedKeys.includes(pv)) {
        markdownString += `**${pv}:** ${objrel[pv]}\n\n`;
      }
    });

    // Add the object type to the Markdown string
    markdownString += `**Object:** ${curmetamodel.objecttypes.find((ot) => ot.id === objrel.typeRef)?.name} ${curmodelview.name} ${objrel.name}\n\n`;
  });

  // Return the Markdown string
  return markdownString;
}

export default ObjDetailToMarkdown;
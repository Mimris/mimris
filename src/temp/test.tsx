case constants.gojs.C_OBJECT:
    inst = selObj.object;
    inst1 = myMetis.findObject(inst?.id);
    if (inst1) inst = inst1;
    instview = selObj.objectview as akm.cxObjectView;
    instview1 = myMetis.findObjectView(instview?.id) as akm.cxObjectView;
    if (instview1) instview = instview1;
    type = selObj.objecttype as akm.cxObjectType;
    type1 = myMetis.findObjectType(type?.id) as akm.cxObjectType;
    if (type1) type = type1;
    objtypeview = type1?.typeview as akm.cxObjectTypeView;
    objtypeview = myMetis.findObjectTypeView(objtypeview?.id) as akm.cxObjectTypeView;
    typeview = objtypeview;
    type.typeview = objtypeview;
    inst.type = type;
break;
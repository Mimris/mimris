
// import { Dispatch } from 'redux';

const debug = false

// const ConnectImportedTopEntityTypes = (props, dispatch) => {


export const setColorsTopEntityTypes = (osduType: string) => {
    switch (osduType) {
        case 'master-data':
            return '#FEA07A';
        case 'work-product':
            return '#FEFECE';
        case 'work-product-component':
            return '#FFD701';
        case 'abstract':
            return '#B0C4DE';
        case 'content':
            return '#F9C846';
        case 'reference-data':
            return '#40E0D0';
        case 'type':
            return '#87CEFE';
        case 'dataset':
            return '#F9C846';
        case 'manifest':
            return '#F9C846';
        case 'Collection':
            return '#BEFFC2';
        case 'Item':
            return '#BEFFC5';
        case 'Property':
            return '#90EE90';
        case 'PropLink':
            return '#BDFFC4';
        case 'object':
            return '#EEEEEE'; 
        default:
            return;
    }
}

// const curModel = props.phData.metis.models.find((m: { id: string; }) => m.id === props.phFocus.focusModel.id)
// const curMetamodel = props.phData.metis.metamodels.find((m: { id: string; }) => m.id === curModel.metamodelRef)
// const curObjects = curModel.objects
// // const curRelships = curModel.relships
// const curModelview = curModel.modelviews.find((mv: { id: string; }) => mv.id === props.phFocus.focusModelview.id)
// const curObjectviews = curModelview.objectviews
// if (debug) console.log('39 currentObjectviews', curMetamodel, curModel, curModelview, curObjects, curObjectviews)
// const mapObjectsviews = curObjectviews?.map((ov: { id: string; name: string; objectRef?: string }) => {
//   const curObject = curObjects.find(o => (ov.objectRef && o.id === ov.objectRef) && o)
//   if (debug) console.log('41 curObject', curObject, curMetamodel)
//   const curObjecttype = curMetamodel?.objecttypes.find((ot: { id: string; }) => ot.id === curObject?.typeRef)

//   if (curObjecttype?.name === 'EntityType') {
//     if (debug) console.log('42 curObject', curObject, curObject.osduType)
//     const fillcolordata = setColorsTopEntityTypes(curObject?.osduType)
//     console.log('49 fillcolordata', fillcolordata)
//     const data = {id: ov.id, fillcolor: fillcolordata}
//     console.log('51 data', ov.name, curObject.osduType, curObjecttype.name, data)
//     dispatch({ type: 'UPDATE_OBJECTVIEW_PROPERTIES', data }); // for propLink object set mark as deleted
//   }
//   if (debug) console.log('52 curObjecttype', curObjecttype)
// })

// // return mapObjectsviews
// }

// export default ConnectImportedTopEntityTypes


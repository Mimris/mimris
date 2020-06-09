import { connect, useSelector, useDispatch } from 'react-redux';
import Selector from './utils/Selector'

const Tasks = () => {
  const state = useSelector((state: any) => state) // Selecting the whole redux store
  console.log('5 Tasks:', state);

  const metamodels = useSelector(metamodels => state.phData?.metis?.metamodels)  // selecting the models array
  const models = useSelector(models => state.phData?.metis?.models)  // selecting the models array
  const focusModel = useSelector(focusModel => state.phFocus?.focusModel)
  const focusModelview = useSelector(focusModelview => state.phFocus.focusModelview)

  // const [model, setModel] = useState(focusModel)
  // console.log('16 Sel', models, focusModel, state);

  const curmodel = models?.find((m: any) => m?.id === focusModel?.id)
  const modelviews = curmodel?.modelviews //.map((mv: any) => mv)
  const objects = curmodel?.objects //.map((o: any) => o)
  // const objectviews = curmodel?.objectviews //.map((o: any) => o)
  // find object with type

  const objectviews = modelviews?.find(mv => mv.id === focusModelview?.id)?.objectviews
  const uniqueovs = objectviews?.filter((ov, index, self) =>
    index === self.findIndex((t) => (
      t.place === ov.place && t.id === ov.id
    ))
  )

  console.log('32 SelectContext :', modelviews);

  // find object with type
  const type = (metamodels, model, objects, curov) => {
    return metamodels?.find(mm => mm.id === (model.metamodelRef))
      .objecttypes?.find(ot => ot.id === objects?.find(o => o.id === curov.objectRef)?.typeRef)?.name
  }

  const seltasks = uniqueovs?.filter(ov => type(metamodels, curmodel, objects, ov) === 'Task')
  const tasksDiv = seltasks?.map((t: any) => 
    <li className="li bg-light">
    {t.name}
    </li>
    )
  console.log('43', tasksDiv);
  
  return (
    <div className="tasklist ">
      <ul>
        {tasksDiv}
      </ul>
      <Selector key='1' type='SET_FOCUS_TASK' selArray={seltasks} selName='Tasks' focustype='focusTask' /><br />
    </div>
  );
}

export default Tasks;

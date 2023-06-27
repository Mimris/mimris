// @ts-nocheck
export default {} ;
if (false) {
<>

    <form>
  <div className="context-list1 border-bottom border-dark">
    <h4>Current Context / Focus:</h4>
    <div className="form-group">
      <label htmlFor="model">Model:</label>
      <input type="text" className="form-control" id="model" value={state.phFocus?.focusModel?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="modelview">Modelview:</label>
      <input type="text" className="form-control" id="modelview" value={state.phFocus?.focusModelview?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="objectview">Objectview:</label>
      <input type="text" className="form-control" id="objectview" value={state.phFocus?.focusObjectview?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="focusObject">Focus Object:</label>
      <input type="text" className="form-control" id="focusObject" value={state.phFocus?.focusObject?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="org">Org:</label>
      <input type="text" className="form-control" id="org" value={state.phFocus?.focusOrg?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="proj">Proj:</label>
      <input type="text" className="form-control" id="proj" value={state.phFocus?.focusProj?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="role">Role:</label>
      <input type="text" className="form-control" id="role" value={state.phFocus?.focusRole?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="task">Task:</label>
      <input type="text" className="form-control" id="task" value={state.phFocus?.focusTask?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="template">Template:</label>
      <input type="text" className="form-control" id="template" value={state.phFocus?.focusTemplateModel?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="templateModelview">TemplateModelview:</label>
      <input type="text" className="form-control" id="templateModelview" value={state.phFocus?.focusTemplateModelview?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="targetModel">TargetModel:</label>
      <input type="text" className="form-control" id="targetModel" value={state.phFocus?.focusTargetModel?.name} />
    </div>
    <div className="form-group">
      <label htmlFor="targetModelview">TargetModelview:</label>
      <input type="text" className="form-control" id="targetModelview" value={state.phFocus?.focusTargetModelview?.name} />
    </div>
  </div>
    </form>


    // pls format so the label is to the left


    // Sure, here's the updated code with labels to the left of the input fields:

    <form>
  <div className="context-list1 border-bottom border-dark">
    <h4>Current Context / Focus:</h4>
    <div className="form-group row">
      <label htmlFor="model" className="col-sm-2 col-form-label">Model:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="model" value={state.phFocus?.focusModel?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="modelview" className="col-sm-2 col-form-label">Modelview:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="modelview" value={state.phFocus?.focusModelview?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="objectview" className="col-sm-2 col-form-label">Objectview:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="objectview" value={state.phFocus?.focusObjectview?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="focusObject" className="col-sm-2 col-form-label">Focus Object:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="focusObject" value={state.phFocus?.focusObject?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="org" className="col-sm-2 col-form-label">Org:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="org" value={state.phFocus?.focusOrg?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="proj" className="col-sm-2 col-form-label">Proj:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="proj" value={state.phFocus?.focusProj?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="role" className="col-sm-2 col-form-label">Role:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="role" value={state.phFocus?.focusRole?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="task" className="col-sm-2 col-form-label">Task:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="task" value={state.phFocus?.focusTask?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="template" className="col-sm-2 col-form-label">Template:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="template" value={state.phFocus?.focusTemplateModel?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="templateModelview" className="col-sm-2 col-form-label">TemplateModelview:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="templateModelview" value={state.phFocus?.focusTemplateModelview?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="targetModel" className="col-sm-2 col-form-label">TargetModel:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="targetModel" value={state.phFocus?.focusTargetModel?.name} />
      </div>
    </div>
    <div className="form-group row">
      <label htmlFor="targetModelview" className="col-sm-2 col-form-label">TargetModelview:</label>
      <div className="col-sm-10">
        <input type="text" className="form-control" id="targetModelview" value={state.phFocus?.focusTargetModelview?.name} />
      </div>
    </div>
  </div>
    </form>






        <form>
          <div className="context-list bg-red border-bottom border-dark ">
            <h4>Current Context / Focus:</h4>
            <div className="form-group row justify-content-end">
              <label htmlFor="modelview" className="col-sm-4 col-form-label ">Modelview:</label>
              <div className="col-sm-8 text-end">
                <input type="text" className="form-control w-100" id="modelview" value={state.phFocus?.focusModelview?.name} />
              </div>
            </div>
                <div className="form-group row">
              <label htmlFor="modelview" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Modelview:</label>
              <div className="col-sm-8 text-end">
                <input type="text" className="form-control w-100" id="modelview" value={state.phFocus?.focusModelview?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="objectview" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Objectview:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="objectview" value={state.phFocus?.focusObjectview?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="focusObject" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Focus Object:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="focusObject" value={state.phFocus?.focusObject?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="org" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Org:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="org" value={state.phFocus?.focusOrg?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="proj" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Proj:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="proj" value={state.phFocus?.focusProj?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="role" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Role:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="role" value={state.phFocus?.focusRole?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="task" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Task:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="task" value={state.phFocus?.focusTask?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="template" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>Template:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="template" value={state.phFocus?.focusTemplateModel?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="templateModelview" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>TemplateModelview:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="templateModelview" value={state.phFocus?.focusTemplateModelview?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="targetModel" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>TargetModel:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="targetModel" value={state.phFocus?.focusTargetModel?.name} />
              </div>
            </div>
            <div className="form-group row">
              <label htmlFor="targetModelview" className="col-sm-3 col-form-label label-auto-width" style={{ width: 'auto' }}>TargetModelview:</label>
              <div className="col-sm-12 text-end">
                <input type="text" className="form-control" id="targetModelview" value={state.phFocus?.focusTargetModelview?.name} />
              </div>
            </div>
          </div>
    </form>



    <form>
        <div className="context-list bg-red border-bottom border-dark">
          <h4>Current Context / Focus:</h4>
          <div className="form-group row justify-content-end">
            <label htmlFor="modelview" className="col-sm-4 col-form-label">name:</label>
            <div className="col-sm-8">
              <input type="text" className="form-control w-100" id="name" value={state.phFocus?.focusModelview?.name} />
            </div>
          </div>
          <div className="form-group row justify-content-end">
            <label htmlFor="modelview" className="col-sm-4 col-form-label">description:</label>
            <div className="col-sm-8">
              <input type="text" className="form-control w-100" id="description" value={state.phFocus?.focusModelview?.description} />
            </div>
          </div>
        </div>
      </form>


</>
}
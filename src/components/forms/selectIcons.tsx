export { iconList, iconList2, imageLibrary } from '@mimris/modelling-editor';

export const selectIcons = (curitem: any, p: any, iconvalue: any, register: any, handleChangesicon: any) => {

  return (
    <>
      <div key={curitem.id + p} className="field d-flex mr-1 float-right" >
        <label className="label mt-1" htmlFor="name">
          {/* icon //: Currentvalue = {props.item.icon} <br/> */}
          icon
          <select className="selectpicker ml-1" value={iconvalue} onChange={handleChangesicon} >
            {/* <option value={`${iconvalue}`}>Current</option> */}
            <option value="https://img.icons8.com/color/2x/object.png">Object</option>
            <option value="https://img.icons8.com/clouds/2x/services.png">Services</option>
            <option value="https://img.icons8.com/color/2x/important-property.png">Important-property</option>
            <option value="https://img.icons8.com/color/2x/urgent-property.png">Urgent-property</option>
            <option value="property1.png">Property.png</option>
            <option value="https://img.icons8.com/color/2x/information.png">Info</option>
            <option value="https://img.icons8.com/color/2x/admin-settings-male.png">Role</option>
            <option value="https://img.icons8.com/color/2x/task.png">Task</option>
            <option value="https://img.icons8.com/color/2x/view-file.png">View</option>
            <option value="https://img.icons8.com/cotton/72/tear-off-calendar.png">Event</option>
            <option value="https://img.icons8.com/color/2x/rules-book.png">Rule</option>
            <option value="https://img.icons8.com/color/2x/approve.png">Decision</option>
            <option value="https://img.icons8.com/color/2x/energy-meter.png">Unittype</option>
            <option value="https://img.icons8.com/color/2x/data-.png">Datatype</option>
            <option value="https://img.icons8.com/color/2x/variable.png">Datavalue</option>
            <option value="https://img.icons8.com/color/2x/person-male.png">Person</option>
            <option value="https://img.icons8.com/color/search">Search</option>
            <option value="analyse.png">Analyse.png</option>
            <option value="automated.jfif">Inclusive.png</option>
            <option value="book.png">Book.png</option>
            <option value="car.png">Car.png</option>
            <option value="default.png">Default.png</option>
            <option value="exclusive.png">Exclusive.png</option>
            <option value="inclusive.png">Inclusive.png</option>
            <option value="info.svg">Info.svg</option>
            <option value="parallel.png">Parallel.png</option>
            <option value="task1.jfif">Task1.jfif</option>
            <option value="tiger.svg">tiger.svg</option>
          </select> Url :
        </label>
        <input className="input pt-0 mt-1 mb-3" style={{ width: "360px" }} onChange={handleChangesicon}
          type="text"
          id={`${curitem.id}+${p}`}
          name={`${p}`}
          value={iconvalue}
          ref={register({ required: false })}
        />
      </div>
      {/* <div><img src={iconvalue}/></div> */}
    </>
  )

}
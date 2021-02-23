

export const iconList = () => [
           {value:"https://img.icons8.com/color/2x/object.png", label: "Object"},
           {value:"https://img.icons8.com/clouds/2x/services.png", label: "Services"},
           {value:"https://img.icons8.com/color/2x/important-property.png", label: "Important-property"},
           {value:"https://img.icons8.com/color/2x/urgent-property.png", label: "Urgent-property"},
           {value:"https://img.icons8.com/color/2x/add-property-1.png", label: "Property"},
           {value:"https://img.icons8.com/color/2x/information.png", label: "Info"},
           {value:"https://img.icons8.com/color/2x/admin-settings-male.png", label: "Role"},
           {value:"https://img.icons8.com/color/2x/task.png", label: "Task"},
           {value:"https://img.icons8.com/color/2x/view-file.png", label: "View"},
           {value:"https://img.icons8.com/cotton/72/tear-off-calendar.png", label: "Event"},
           {value:"https://img.icons8.com/color/2x/rules-book.png", label: "Rule"},
           {value:"https://img.icons8.com/color/2x/approve.png", label: "Decision"},
           {value:"https://img.icons8.com/color/2x/energy-meter.png", label: "Unittype"},
           {value:"https://img.icons8.com/color/2x/data-.png", label: "Datatype"},
           {value:"https://img.icons8.com/color/2x/variable.png", label: "Datavalue"},
           {value:"https://img.icons8.com/color/2x/person-male.png", label: "Person"},
           {value:"https://img.icons8.com/color/search", label: "Search"},
           {value:"analyse.png", label: "Analyse.png"},
           {value:"automated.jfif", label: "Inclusive.png"},
           {value:"book.png", label: "Book.png"},
           {value:"car.png", label: "Car.png"},
           {value:"default.png", label: "Default.png"},
           {value:"exclusive.png", label: "Exclusive.png"},
           {value:"inclusive.png", label: "Inclusive.png"},
           {value:"info.svg", label: "Info.svg"},
           {value:"parallel.png", label: "Parallel.png"},
           {value:"task1.jfif", label: "Task1.jfif"},
           {value:"tiger.svg", label: "tiger.svg"},
  ]

export const selectIcons = (curitem, p, iconvalue, register, handleChangesicon) => {

  return (
    <>
      <div key={curitem.id + p} className="field" >
        <label className="label mt-1" htmlFor="name">
          {/* icon //: Currentvalue = {props.item.icon} <br/> */}
          icon
          <select className="selectpicker ml-2 float-right" value={iconvalue} onChange={handleChangesicon} >
            {/* <option value={`${iconvalue}`}>Current</option> */}
            <option value="https://img.icons8.com/color/2x/object.png">Object</option>
            <option value="https://img.icons8.com/clouds/2x/services.png">Services</option>
            <option value="https://img.icons8.com/color/2x/important-property.png">Important-property</option>
            <option value="https://img.icons8.com/color/2x/urgent-property.png">Urgent-property</option>
            <option value="https://img.icons8.com/color/2x/add-property-1.png">Property</option>
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
          </select>
        </label>
        <span className="ml-1">Url :</span>
        <input className="input ml-1 pt-1 w-50" onChange={handleChangesicon}
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
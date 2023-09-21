

export const iconList = () => [
           {value:"https://img.icons8.com/color/2x/object.png", label: "Object"},
           {value:"https://img.icons8.com/clouds/2x/services.png", label: "Services"},
           {value:"https://img.icons8.com/color/2x/important-property.png", label: "Important-property"},
           {value:"https://img.icons8.com/color/2x/urgent-property.png", label: "Urgent-property"},
           {value:"property.png", label: "Property"},
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
           {value:"Organisation1.png", label: "Organisation1.png"},
           {value:"Organisation2.png", label: "Organisation2.png"},
           {value:"OrganisationUnit.png", label: "OrganisationUnit.png"},
           {value:"Method.png", label: "Method.png"},
           {value:"Format.png", label: "Format.png"},
           {value:"Select.png", label: "Select.png"},
           {value:"RegExp.png", label: "RegExp.png"},
           {value:"analyse.png", label: "Analyse.png"},
           {value:"automated.jfif", label: "Inclusive.png"},
           {value:"book.png", label: "Book.png"},
           {value:"carpark.png", label: "Carpark.png"},
           {value:"car.png", label: "Car.png"},
           {value:"default.png", label: "Default.png"},
           {value:"E-Scooter.png", label: "E-Scooter.png"},
           {value:"exclusive.png", label: "Exclusive.png"},
           {value:"inclusive.png", label: "Inclusive.png"},
           {value:"info.svg", label: "Info.svg"},
           {value:"parallel.png", label: "Parallel.png"},
           {value:"task1.jfif", label: "Task1.jfif"},
           {value:"tiger.svg", label: "tiger.svg"},

           {value:"Archimate Capability.png", label: "Capability.png"},
           {value:"Archimate CourseOfAction.png", label: "CourseOfAction.png"},
           {value:"Archimate Driver.png", label: "Driver.png"},
           {value:"Archimate Resource.png", label: "Resource.png"},
           {value:"Archimate ValueStream.png", label: "ValueStream.png"},

           {value:"file-earmark-image.svg", label: "file-earmark-image.svg"},
           {value:"bug.svg", label: "bug.svg"},
           {value:"ui-checks.svg", label: "ui-checks.svg"},
           {value:"youtube.svg", label: "youtube.svg"},
           {value:"speedometer.svg", label: "speedometer.svg"},
           {value:"person-square.svg", label: "person-square.svg"},
           {value:"palette.svg", label: "palette.svg"},
           {value:"layers.svg", label: "layers.svg"},
           {value:"inboxes.svg", label: "inboxes.svg"},
           {value:"house-door.svg", label: "house-door.svg"},
           {value:"hand-thumbs-up.svg", label: "hands-thumbs-up.svg"},
           {value:"folder-check.svg", label: "folder-check.svg"},
           {value:"exclamation-triangle.svg", label: "exclamation-triangle.svg"},
           {value:"chat-square-text.svg", label: "chat-square-text.svg"},
           {value:"check-square-fill.svg", label: "check-square-fill.svg"},
           {value:"check-square.svg", label: "check-square.svg"},
           {value:"braces.svg", label: "braces.svg"},
           {value:"bug.svg", label: "bug.svg"},
           {value:"bullseye.svg", label: "bullseye.svg"},
  ]
export const iconList2 = () => [
           {value:"x-octagon.svg", label: "x-octagon.svg"},
   
  ]

export const selectIcons = (curitem, p, iconvalue, register, handleChangesicon) => {

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
        <input className="input pt-0 mt-1 mb-3" style={{width: "360px"}} onChange={handleChangesicon}
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
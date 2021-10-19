import SelectContext from './SelectContext'
import LoadServer from './LoadServer'
import Link from 'next/link';

const Help = () => {
  return (
    <div style={{ paddingTop: "4px", backgroundColor: "white" }}>
      <div style={{ fontSize: "80%", backgroundColor: "#bbb", border: "2px", margin: "1px", padding: "3px" }}> Start Modelling
        <div className="task-link bg-light" >
          <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#source"><span >? </span></a>
          <a className="btn btn-link btn-sm" ><LoadServer className='button ContextModal' buttonLabel='Save/Load Model' /></a>
          <div className="collapse bg-light p-1 b-1" id="source" style={{ backgroundColor: "#fefefe", }}>
            <a> Click on "Local or Server" button above to save/load current models from local storage or server repository. </a>
            <a style={{ maxWidth: "50px", float: "right" }} data-toggle="collapse" href="#insert-more"><span >(more...)</span></a>
            <div className="collapse bg-transparent p-1" id="insert-more" style={{ backgroundColor: "#fefefe" }}>
              Temporary copy/backup: RightClick here and select Inspect (Ctrl-Alt-I) Select the Application Tab, and then "Storage", then state.
              RightClick the state "value" and select "Edit value". Press Ctrl-C to copy the store and paste it in a Notepad document.
              If you want to reuse the copied store just copy from Notepad and "Edit value" again, and press Ctrl-V to paste the store back to localStorage state.
            </div>
          </div>
        </div>

        <div className="task-item bg-light" >
            <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#context"><span >? </span></a>
            <a className="btn btn-link btn-sm" ><SelectContext className='button ContextModal' buttonLabel='Set Context' /></a>
            <div className="collapse bg-light p-1 b-1" id="context" style={{ backgroundColor: "#fefefe", }}>  
              <a> Click on "Set context" above or link in the upper right corner. </a>
              <a> In Popup "Set Context Form": Select Model and Modelview.</a>
            </div>
        
        </div>
        <div className="task-item bg-light" >
          <div className="btn btn-link btn-sm" >
            {/* <Link href="/diagram"><a className="nav-link">Modelling</a></Link> */}
            <Link href="/modelling"><a className="task-link">OPEN MODEL</a></Link>
          </div>
          <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#model"><span >? </span> </a>
          <div className="collapse bg-light p-1 b-1" id="model" style={{ backgroundColor: "#fefefe", }}>
            <a>To view the model selected in "Set Context", go to the modelling page by select "Modelling" in the top-menu</a>
            <a> Click on refresh both in Modelling pane and Palette pane if neccessary.</a>
          </div>
        </div>

        <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Window size </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#refresh"><span >? </span></a>
          <div className="collapse bg-light p-1 b-1" id="refresh" style={{ backgroundColor: "#fefefe", }}>
            <a> The Palette and the Model area will adjust to the browser window size.</a>
          </div>
        </div>
        <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Zoom in / out </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#zoom"><span >? </span></a>
          <div className="collapse bg-light p-1 b-1" id="zoom" style={{ backgroundColor: "#fefefe", }}>
            <a>In the Model area or Palette area: Left-Click and scroll on the mouse-wheel.</a>
          </div>
        </div>
        <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Scroll </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#scroll"><span >? </span></a>
          <div className="collapse bg-light p-1 b-1" id="scroll" style={{ backgroundColor: "#fefefe", }}>
            <a>In the Model area or Palette area: Left-Click and scroll on the mouse-wheel.</a>
            <br /> <br /><a>Left-Click again to toggle between zoom and scrool up and down.</a>
            <br /> <br /><a>Press and hold Shift key to scroll right and left.</a>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "80%", backgroundColor: "#bbb", border: "2px", margin: "1px", padding: "3px" }}> Modelling Menu
          <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Insert new object </a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#insert"><span >? </span></a>
          <div className="collapse bg-light p-1 b-1" id="insert" style={{ backgroundColor: "#fefefe", }}>
            <a>Click on an object in the palette ( left pane ) and drag and drop in the modelling area (right pane)</a>
            <a style={{ maxWidth: "50px", float: "right" }} data-toggle="collapse" href="#insert-more"><span >(more...)</span></a>
            <div className="collapse bg-transparent p-1" id="insert-more" style={{ backgroundColor: "#fefefe" }}>
              Double-click on the text to edit.
              </div>
          </div>
        </div>
        <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Connect two objects</a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#connect"><span >?</span></a>
          <div className="collapse bg-light p-1 b-1" id="connect" style={{ backgroundColor: "#fefefe", }}>
            <a>Click on an object edge and drag and drop in the another object.</a>
          </div>
        </div>
        <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Delete Object</a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#delete"><span >? </span></a>
          <div className="collapse bg-light p-1 b-1" id="delete" style={{ backgroundColor: "#fefefe", }}>
            <a>Rigth-Click on an object and select "Delete".</a>
          </div>
        </div>
        <div className="task-item bg-light" >
          <a className="btn btn-link btn-sm" >Copy Object</a> <a className="btn btn-sm btn-link float-right" data-toggle="collapse" href="#copy"><span >? </span></a>
          <div className="collapse bg-light p-1 b-1" id="copy" style={{ backgroundColor: "#fefefe", }}>
            <a>Rigth-Click on an object and select "Copy", then Right-Click on the background or within a View object and select "Paste"</a>
          </div>
        </div>
      </div>
      <style jsx>{`
        .btn {
          font-size: 80%;
          font-weight: bold;
        }
       `}</style>
    </div>
  );
}

export default Help;

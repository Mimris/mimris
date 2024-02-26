import { connect, useDispatch } from 'react-redux';
import Page from '../components/page';
import Layout from '../components/Layout';
import Link from 'next/link';
import SelectVideo from '../components/SelectVideo'


// import { loadData } from '../actions/actions'

const page = (props: any) => {
// export default function Contexts({ contexts }: any) {

  const dispatch = useDispatch();

  // if (!props.phData) {
  //   dispatch(loadData())
  // }


  return (
    <>
      <Layout user={props.phUser?.focusUser} >
        <div id="video" >
          <div className="wrapper" >
            {/* <div className="header " ></div>  */}
            {/* <div className="workplace" > */}
              {/* <div className="contextarea" > </div> */}
              <div className="pt-2 " style={{backgroundColor: "#b0cfcf"}}>
                <h1 className="homepage-vido mx-3">Instruction and demo Videos and Guides</h1>
                <h6 className="bg-transparent text-white mx-3 p-1" > Right-click on the links to open in a new tab or window</h6>
                <div className="homepage-vido d-flex justify-content-between align-items-baseline flex-wrap">
                  <div className="card-body card-video-body p-2" style={{ minHeight: "250px", maxWidth: "55rem" }}>
                    <h3 className="card-title">Learn AKM Modelling</h3>
                    <div className="card-text bg-light p-4 mt-2">          
                      <h5 className="card-title">Concept Modelling</h5>
                        Instruction videos:
                      <div className="card-text m-2">
                        <a href="https://app.guidde.com/share/playbooks/5kfvMyqNcETCnu44cx5u9h?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                        className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                        {/* <i className="fas fas-plus fa-sm"></i> */}
                          Building a Concept model example E-Scooter rental (from scratch)</a>
                      </div>
                      <hr />
                      <h5 className="card-title">Metamodelling</h5>
                      <div className="card-text m-2">
                        <a href="https://app.guidde.com/share/playbooks/hmkKyNh7gndzmyt5XC2nhx?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                          className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                          {/* <i className="fa fa-arrow-left fa-sm"></i> */}
                          Bulding a Metamodel as a Typedefinition model for the example above (coming soon)
                        </a>
                      </div>
                      <hr />
                      <h5 className="card-title">Solution Modelling</h5>
                      <div className="card-text m-2">
                        <a href="" 
                          className="button btn-link bg-light text-secondary rounded p-2" target="_blank">
                          {/* <i className="fa fa-arrow-left fa-sm"></i> */}
                          Bulding a Solution model for the example above (coming soon)
                        </a>
                      </div>
                      <hr />
                    </div>
                  </div>
                  <div className="card-body card-video-body p-2" style={{ minHeight: "250px", maxWidth: "55rem" }}>
                    <h3 className="card-title">Learn OSDU Schema import and visualization</h3>
                    <div className="card-text bg-light p-4 mt-2">Instruction videos:
                      <div className="card-text m-2">
                        <a href="https://app.guidde.com/share/playbooks/vPvzrv5199xdPFmRoUptNb?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                          className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                          <i className="fa fa-arrow-left fa-sm"></i>
                          How to import OSDU Schematypes into AKM Modeller
                        </a>
                      </div>
                      <h5 className="card-text">Demos</h5>
                      <div className="card-text m-2">
                        <a  href="https://app.guidde.com/share/playbooks/dJwLk6Z6B48zfxyYjDrk2E?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                          className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                          <i className="fa fa-arrow-left fa-sm"></i>
                          OSDU Import Demo
                        </a>
                      </div>
                    </div>
                  </div>
                    <div className="card-body card-video-body p-2" style={{ minHeight: "250px", maxWidth: "55rem" }}>
                    <h3 className="card-title">Learn to use Github</h3>
                    <div className="card-text bg-light p-4 mt-2">          
                      <h5 className="card-title">Github</h5>
                      <div className="card-text m-2">
                        <a href="https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/quickstart-for-writing-on-github" 
                        className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                        <i className="fa fa-arrow-left fa-sm"></i>
                          Quickstart for writing Markdown on GitHub
                          </a>
                      </div>
                      <hr />
                      <h5 className="card-title">Github Project</h5>
                      <div className="card-text m-2">
                        <a href="https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/quickstart-for-projects" 
                          className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                          <i className="fa fa-arrow-left fa-sm"></i>
                          Quickstart for GitHub Projects
                        </a>
                      </div>
                      <hr />
                      <h5 className="card-title">GitHub Issues</h5>
                      <div className="card-text m-2">
                        <a href="https://docs.github.com/en/issues/tracking-your-work-with-issues/quickstart" 
                          className="button btn-link bg-light text-primary rounded p-2" target="_blank">
                          <i className="fa fa-arrow-left fa-sm"></i>
                          Quickstart for GitHub Issues
                        </a>
                      </div>
                      <hr />
                    </div>
                  </div>
                </div>
              {/* <div className="tasksarea"></div> */}
              {/* <div className="footer"> </div> */}
              </div>
          </div>
        </div> 
      </Layout>
    </>
  )

}

export default Page(connect(state => state)(page));

                    {/* <SelectVideo />
                    <Link href="/modelling" className="nav-link text-primary ">Back</Link> */}

import { useEffect } from 'react';
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
              <div className="pt-2" style={{backgroundColor: "#b0cfcf"}}></div>
              <h1 className="homepage-video">Videos to learn AKM Modelling</h1>
              <div className="homepage-video d-flex align-items-start justify-content-between">
                <div className="card-body card-video-body bg-light p-2">
                  <h4 className="card-title">OSDU</h4>
                  <p className="card-text">Demos</p>
                  <div className="card-text m-2">
                    <a  href="https://app.guidde.com/share/playbooks/dJwLk6Z6B48zfxyYjDrk2E?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                    className="btn btn-sm bg-link p-1 w-100" target="_blank">OSDU Import Demo</a>
                 </div>
                <p className="card-text">Instruction videos:</p>
                <div className="card-text m-2">
                    <a href="https://app.guidde.com/share/playbooks/vPvzrv5199xdPFmRoUptNb?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                    className="btn btn-primary p-1 w-100" target="_blank">How to import OSDU Schematypes into AKM Modeller</a>
                  </div>
                </div>
                <div className="card-body card-video-body bg-light p-2 ">
                  <h4 className="card-title">Concept modelling</h4>
                   <p className="card-text">Instruction videos:</p>
                  <div className="card-text m-2">
                    <a href="https://app.guidde.com/share/playbooks/5kfvMyqNcETCnu44cx5u9h?origin=6lqYHLd8QJXDE2ZJA8TtSnurix83" 
                    className="btn btn-primary p-1 w-100" target="_blank">Building a concept model example from scratch</a>
                  </div>
                </div>
                <div className="card-body card-video-body bg-light p-2 ">
                  <h4 className="card-title">Metamodelling</h4>
                  <p className="card-text">Metamodelling using the AKM Core metamodel</p>
                  <div className="card-text m-2">
                    {/* <a href="" 
                    className="btn btn-primary p-1 w-100" target="_blank">Building a concept model from scratch using IRTV metamodel</a> */}
                  </div>
                </div>
              </div>
              {/* <div className="tasksarea"></div> */}
              {/* <div className="footer"> </div> */}
          </div>
        </div> 
      </Layout>
    </>
  )

}

export default Page(connect(state => state)(page));

                    {/* <SelectVideo />
                    <Link href="/modelling" className="nav-link text-primary ">Back</Link> */}
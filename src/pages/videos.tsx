
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
            {/* <div className="header" > </div> */} 
            {/* <div className="workplace" > */}
              {/* <div className="contextarea" > </div> */}
              <div className="homepage-video px-2 d-flex flex-column " >
                <div className="card-body card-video-body w-100">
                <SelectVideo />
                <Link href="/modelling" className="nav-link text-primary ">Back</Link>
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
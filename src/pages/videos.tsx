
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
              <div className="workarea bg-warning p-4 d-flex flex-column justify-content-between" >
                <SelectVideo />
                <Link href="/modelling"><a className="nav-link text-white">Back</a></Link>
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
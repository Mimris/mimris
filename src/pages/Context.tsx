
import { useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
// import { loadData } from '../actions/actions'
// import { NextPageContext } from "next";
// import { myGet } from "../defs/myGet";
import Page from '../components/page';
import Layout from '../components/Layout';
import Link from 'next/link';
import SetContext from '../defs/SetContext'

// import { loadData } from '../actions/actions'

const page = (props: any) => {
// export default function Contexts({ contexts }: any) {

  const dispatch = useDispatch();

  // if (!props.phData) {
  //   dispatch(loadData())
  // }

  let focus = props?.phFocus
  const focusModelId = props.phFocus.focusModel.id
  console.log('27', focusModelId);

  useEffect(() => {
    focus = props.phFocus
    console.log('45', focus);
    const updatefocususer = ({
        focusUser: {
          ...props.phUser?.focusUser,
            session: {
              phFocus: focus
            }
          }
      })  
    const data = updatefocususer.focusUser
    dispatch({ type: 'SET_FOCUS_USER', data })
  }, [focusModelId]);

  const setContextDiv = (props.phFocus) && <SetContext phF={props.phFocus} />


  return (
    <>
      <Layout user={props.phUser?.focusUser} >
        <div id="index" >
          <div className="wrapper" >
            <div className="workplace" >
              <div className="contextarea" >
                {setContextDiv}
              </div>
              <div className="tasksarea"  >
  
              </div>
              <Link href="/settings">
                <a>Back</a>
              </Link>
              <h3>Current Context:</h3>
              {/* {contextDiv}  */}
              <div> {JSON.stringify(focus, null, 2)}</div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )

}

// Contexts.getInitialProps = async (ctx: NextPageContext) => {
//   const json = await myGet('http://localhost:4050/api/person/1/contexts', ctx);
//   return { contexts: json };
// }

export default Page(connect(state => state)(page));





// import { NextPageContext } from "next";
// import { myGet } from "../defs/myGet";
// import Layout from '../components/Layout';
// import Link from 'next/link';

// // import { loadData } from '../actions/actions'

// export default function Contexts({ contexts }: any) {
//   const curContext = contexts.phFocus;

//   return (
//     <>
//       <Layout>
//         <Link href="/settings">
//           <a>Back</a>
//         </Link>
//         <h3>Contexts list:</h3>
//         <div> {JSON.stringify(curContext)}</div>
//       </Layout>
//     </>
//   )
// }

// Contexts.getInitialProps = async (ctx: NextPageContext) => {
//   const json = await myGet('http://localhost:4050/api/person/1/contexts', ctx);
//   return { contexts: json };
// }